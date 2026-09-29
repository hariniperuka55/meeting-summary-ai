const express = require("express");
const cors = require("cors");
const dotenv = require("dotenv");
const Groq = require("groq-sdk");
const { HindsightClient } = require("@vectorize-io/hindsight-client");
const fs = require("fs");
const path = require("path");

dotenv.config();

const app = express();

app.use(cors());
app.use(express.json());

const groq = new Groq({
  apiKey: process.env.GROQ_API_KEY,
});

const hindsight = new HindsightClient({
  baseUrl: "https://api.hindsight.vectorize.io",
  apiKey: process.env.HINDSIGHT_API_KEY,
});

const BANK_ID = process.env.HINDSIGHT_BANK_ID;

// ==========================================
// MEETING STORAGE
// ==========================================

const meetingsFile = path.join(__dirname, "meetings.json");

function readMeetings() {
  try {
    if (!fs.existsSync(meetingsFile)) {
      fs.writeFileSync(meetingsFile, "[]");
    }

    const data = fs.readFileSync(meetingsFile, "utf8");

    return JSON.parse(data || "[]");
  } catch (error) {
    console.error("Could not read meetings:", error);
    return [];
  }
}

function writeMeetings(meetings) {
  fs.writeFileSync(
    meetingsFile,
    JSON.stringify(meetings, null, 2)
  );
}

// Home Route
app.get("/", (req, res) => {
  res.send("Meeting Agent Backend Running");
});

// Test Groq
app.get("/test", async (req, res) => {
  try {
    const completion = await groq.chat.completions.create({
      messages: [
        {
          role: "user",
          content: "Who are you?",
        },
      ],
      model: "openai/gpt-oss-20b",
    });

    res.json({
      answer: completion.choices[0].message.content,
    });
  } catch (error) {
    res.status(500).json({
      error: error.message,
    });
  }
});

// ==========================================
// CREATE AI-POWERED MEETING
// ==========================================

app.post("/meetings", async (req, res) => {
  try {
    const {
      userId,
      title,
      date,
      participants,
      note
    } = req.body;

    // -----------------------------
    // Validate input
    // -----------------------------

    if (!userId) {
      return res.status(400).json({
        error: "userId is required"
      });
    }

    if (!title) {
      return res.status(400).json({
        error: "title is required"
      });
    }

    if (!note) {
      return res.status(400).json({
        error: "note is required"
      });
    }

    // -----------------------------
    // Ask Groq to analyze meeting
    // -----------------------------

    const prompt = `
You are a meeting intelligence assistant.

Analyze the following meeting.

Meeting Title:
${title}

Participants:
${(participants || []).join(", ")}

Meeting Notes:
${note}

Extract the following information:

1. A short summary
2. Important decisions
3. Action items
4. Commitments

Rules:
- Only use information present in the meeting notes.
- Do not invent facts.
- Keep the language simple.
- If a section has no information, return an empty array.
- Return ONLY valid JSON.
- Do not use markdown.
- Do not add explanations outside the JSON.

Return exactly this structure:

{
  "summary": "short meeting summary",
  "decisions": [
    "decision 1"
  ],
  "actionItems": [
    "action item 1"
  ],
  "commitments": [
    "commitment 1"
  ]
}
`;

    const completion =
      await groq.chat.completions.create({
        messages: [
          {
            role: "user",
            content: prompt
          }
        ],
        model: "openai/gpt-oss-20b"
      });

    const aiText =
      completion.choices[0].message.content;

    // -----------------------------
    // Parse AI response
    // -----------------------------

    let analysis;

    try {
      analysis = JSON.parse(aiText);
    } catch (parseError) {
      console.error(
        "Could not parse AI response:",
        aiText
      );

      analysis = {
        summary: aiText,
        decisions: [],
        actionItems: [],
        commitments: []
      };
    }

    // -----------------------------
    // Create meeting object
    // -----------------------------

    const meeting = {
      id: `meeting-${Date.now()}`,

      userId,

      title,

      date:
        date ||
        new Date().toISOString(),

      participants:
        participants || [],

      note,

      summary:
        analysis.summary || "",

      decisions:
        Array.isArray(analysis.decisions)
          ? analysis.decisions
          : [],

      actionItems:
        Array.isArray(analysis.actionItems)
          ? analysis.actionItems
          : [],

      commitments:
        Array.isArray(analysis.commitments)
          ? analysis.commitments
          : [],

      createdAt:
        new Date().toISOString(),

      updatedAt:
        new Date().toISOString()
    };

    // -----------------------------
    // Save meeting locally
    // -----------------------------

    const meetings = readMeetings();

    meetings.push(meeting);

    writeMeetings(meetings);

    // -----------------------------
    // Store meeting in Hindsight
    // -----------------------------

    const bankId =
      `meeting-agent-${userId}`;

    const hindsightMemory = `
Meeting ID: ${meeting.id}

Meeting Title:
${meeting.title}

Date:
${meeting.date}

Participants:
${meeting.participants.join(", ")}

Original Meeting Notes:
${meeting.note}

Summary:
${meeting.summary}

Decisions:
${meeting.decisions.join("\n")}

Action Items:
${meeting.actionItems.join("\n")}

Commitments:
${meeting.commitments.join("\n")}
`;

    await hindsight.retain(
      bankId,
      hindsightMemory,
      {
        context: `meeting ${meeting.id}`
      }
    );

    // -----------------------------
    // Return meeting
    // -----------------------------

    res.status(201).json({
      success: true,
      meeting
    });

  } catch (error) {

    console.error(
      "Create meeting error:",
      error
    );

    res.status(500).json({
      error: error.message
    });
  }
});

// ==========================================
// GET ALL MEETINGS FOR A USER
// ==========================================

app.get("/meetings", (req, res) => {
  try {
    const userId = req.query.userId;

    if (!userId) {
      return res.status(400).json({
        error: "userId is required"
      });
    }

    const meetings = readMeetings();

    const userMeetings = meetings
      .filter(meeting => meeting.userId === userId)
      .sort(
        (a, b) =>
          new Date(b.date) - new Date(a.date)
      );

    res.json({
      success: true,
      meetings: userMeetings
    });

  } catch (error) {
    console.error("Get meetings error:", error);

    res.status(500).json({
      error: error.message
    });
  }
});

// ==========================================
// ASK AI ABOUT ONE SPECIFIC MEETING
// ==========================================

app.post("/meetings/:id/ask", async (req, res) => {
  try {
    const meetingId = req.params.id;
    const { userId, question } = req.body;

    if (!userId) {
      return res.status(400).json({
        error: "userId is required"
      });
    }

    if (!question) {
      return res.status(400).json({
        error: "question is required"
      });
    }

    // --------------------------------------
    // Find the meeting
    // --------------------------------------

    const meetings = readMeetings();

    const meeting = meetings.find(
      item =>
        item.id === meetingId &&
        item.userId === userId
    );

    if (!meeting) {
      return res.status(404).json({
        error: "Meeting not found"
      });
    }

    // --------------------------------------
    // Ask Hindsight for relevant context
    // --------------------------------------

    const bankId =
      `meeting-agent-${userId}`;

    const recallResult =
      await hindsight.recall(
        bankId,
        `${meeting.title} ${question}`
      );

    const memories =
      recallResult.results
        .map(item => item.text)
        .join("\n");

    // --------------------------------------
    // Build AI prompt
    // --------------------------------------

    const prompt = `
You are an AI meeting assistant.

Answer the user's question about ONE specific meeting.

Meeting:
${meeting.title}

Meeting Date:
${meeting.date}

Participants:
${meeting.participants.join(", ")}

Original Meeting Notes:
${meeting.note}

Meeting Summary:
${meeting.summary}

Decisions:
${meeting.decisions.join("\n")}

Action Items:
${meeting.actionItems.join("\n")}

Commitments:
${meeting.commitments.join("\n")}

Additional relevant memory:
${memories}

User Question:
${question}

Rules:
- Answer only using information related to this meeting.
- Do not invent information.
- Use simple English.
- Be concise and practical.
- If the answer is not available, say that the meeting does not contain that information.
`;

    // --------------------------------------
    // Ask Groq
    // --------------------------------------

    const completion =
      await groq.chat.completions.create({
        messages: [
          {
            role: "user",
            content: prompt
          }
        ],
        model: "openai/gpt-oss-20b"
      });

    const answer =
      completion.choices[0].message.content;

    // --------------------------------------
    // Return answer
    // --------------------------------------

    res.json({
      success: true,
      meetingId,
      question,
      answer
    });

  } catch (error) {

    console.error(
      "Meeting AI error:",
      error
    );

    res.status(500).json({
      error: error.message
    });
  }
});
// ==========================================
// GET ONE MEETING
// ==========================================

app.get("/meetings/:id", (req, res) => {
  try {
    const meetingId = req.params.id;
    const userId = req.query.userId;

    if (!userId) {
      return res.status(400).json({
        error: "userId is required"
      });
    }

    const meetings = readMeetings();

    const meeting = meetings.find(
      item =>
        item.id === meetingId &&
        item.userId === userId
    );

    if (!meeting) {
      return res.status(404).json({
        error: "Meeting not found"
      });
    }

    res.json({
      success: true,
      meeting
    });

  } catch (error) {
    console.error("Get meeting error:", error);

    res.status(500).json({
      error: error.message
    });
  }
});
// Save Meeting into Hindsight
app.post("/saveMeeting", async (req, res) => {
  try {

    const { userId, note } = req.body;

    const bankId = `meeting-agent-${userId}`;

    const result = await hindsight.retain(
      bankId,
      note,
      {
        context: "meeting notes"
      }
    );

    res.json({
      success: true,
      bankId: bankId,
      result
    });

  } catch (error) {

    res.status(500).json({
      error: error.message
    });

  }
});
      app.get("/retain-test", async (req, res) => {
  try {

    const result = await hindsight.retain(
      BANK_ID,
      "Client ABC likes dashboards and has budget 50k",
      {
        context: "meeting notes"
      }
    );

    res.json(result);

  } catch (error) {
    res.status(500).json({
      error: error.message
    });
  }
});

// Ask Question using Hindsight + Groq
app.post("/ask", async (req, res) => {
  try {

    const { userId, question } = req.body;

const bankId = `meeting-agent-${userId}`;

const recallResult =
  await hindsight.recall(
    bankId,
    question
  );

    const memories =
      recallResult.results
        .map(memory => memory.text)
        .join("\n");

    const prompt = `
Relevant Meeting Memories:

${memories}

Question:
${question}

Answer based only on the meeting memories.

Rules:
- Be clear and concise.
- Use simple English.
- If information is missing, say so.
- Give practical answers, not technical analysis.
`;

    const completion =
      await groq.chat.completions.create({
        messages: [
          {
            role: "user",
            content: prompt
          }
        ],
        model: "openai/gpt-oss-20b"
      });

    res.json({
      answer:
        completion.choices[0].message.content
    });

  } catch (error) {

    console.log(error);

    res.status(500).json({
      error: error.message
    });

  }
});
app.get("/ask-test", async (req, res) => {
  try {

    const userId = req.query.userId;

const bankId = `meeting-agent-${userId}`;

const question =
  "Prepare me for tomorrow's meeting";

const recallResult =
  await hindsight.recall(
    bankId,
    question
  );

    const memories =
      recallResult.results
        .map(memory => memory.text)
        .join("\n");

    const prompt = `
Relevant Meeting Memories:

${memories}

Question:
${question}

Answer based on the meeting memories.
`;

    const completion =
      await groq.chat.completions.create({
        messages: [
          {
            role: "user",
            content: prompt
          }
        ],
        model: "openai/gpt-oss-20b"
      });

    res.json({
      memories,
      answer:
        completion.choices[0].message.content
    });

  } catch (error) {

    res.status(500).json({
      error: error.message
    });

  }
});

app.get("/recall-test", async (req, res) => {
  try {

    const userId = req.query.userId;

const bankId = `meeting-agent-${userId}`;

const result = await hindsight.recall(
  bankId,
  "What does Client ABC prefer?"
);

    res.json(result);

  } catch (error) {

    console.log(error);

    res.status(500).json({
      error: error.message
    });

  }
});
// Simple Hindsight Test
app.get("/hindsight-test", async (req, res) => {
  try {
    const version =
      await hindsight.getVersion();

    res.json({
      success: true,
      version,
    });
  } catch (error) {
    console.log(error);

    res.status(500).json({
      success: false,
      error: error.message,
    });
  }
});
app.get("/meeting-brief", async (req, res) => {
  try {
    const userId = req.query.userId;

    if (!userId) {
      return res.status(400).json({
        error: "userId is required"
      });
    }

    const bankId = `meeting-agent-${userId}`;

    const recallResult = await hindsight.recall(
      bankId,
      "meeting preparation client preferences budget pending tasks talking points"
    );

    const memories = recallResult.results
      .map((m) => m.text)
      .join("\n");

    const prompt = `
You are a meeting copilot.

Using ONLY the meeting memories below, create a short and useful meeting brief.

Return the following sections:

Client:
Preferences:
Budget:
Pending Tasks:
Talking Points:

Meeting Memories:
${memories}
`;

    const completion = await groq.chat.completions.create({
      messages: [
        {
          role: "user",
          content: prompt
        }
      ],
      model: "openai/gpt-oss-20b"
    });

    res.json({
      brief: completion.choices[0].message.content
    });

  } catch (error) {
    console.log(error);

    res.status(500).json({
      error: error.message
    });
  }
});
app.get("/client-profile", async (req, res) => {
  try {

    const userId = req.query.userId;

    const bankId = `meeting-agent-${userId}`;

    const recallResult =
      await hindsight.recall(
        bankId,
        "Client ABC"
      );

    const memories =
      recallResult.results
        .map(m => m.text)
        .join("\n");

   const prompt = `
You are a CRM assistant.

Create a simple client snapshot.

Rules:
- Simple English.
- Do not repeat information.
- Keep it concise.

Output format:

Client Snapshot

Name:
Main Interests:
Budget:

Important Notes:
• ...
• ...

Things To Watch:
• ...
• ...

Memories:
${memories}
`;

    const completion =
      await groq.chat.completions.create({
        messages: [
          {
            role: "user",
            content: prompt
          }
        ],
        model: "openai/gpt-oss-20b"
      });

    res.json({
      profile:
        completion.choices[0].message.content
    });

  } catch (error) {

    res.status(500).json({
      error: error.message
    });

  }
});app.get("/commitment-test", async (req, res) => {

  const userId = req.query.userId;

  const bankId = `meeting-agent-${userId}`;

  await hindsight.retain(
    bankId,
    `
    We will send proposal by Friday.
    Dashboard demo next Tuesday.
    Share pricing document with client.
    `,
    {
      context: "meeting notes"
    }
  );

  res.json({
    success: true,
    bankId: bankId
  });

});
app.get("/all-memories", async (req, res) => {
  try {

    const userId = req.query.userId;

const bankId = `meeting-agent-${userId}`;

const result = await hindsight.recall(
  bankId,
  "proposal Friday dashboard demo pricing document"
);

    res.json(result);

  } catch (error) {

    res.status(500).json({
      error: error.message
    });

  }
});
app.get("/pending-tasks", async (req, res) => {
  try {

    const userId = req.query.userId;

    const bankId = `meeting-agent-${userId}`;

    const result = await hindsight.recall(
      bankId,
      "proposal dashboard demo pricing document"
    );

    const memories = result.results
      .map(item => item.text)
      .join("\n");

    const completion =
      await groq.chat.completions.create({
        messages: [
          {
            role: "user",
            content: `
You are a task extraction assistant.

Convert the meeting memories into a clean task list.

Rules:
- Use simple English.
- Remove duplicate tasks.
- Keep tasks short.
- Include dates only if mentioned.
- Return only the task list.

Memories:
${memories}
`
          }
        ],
        model: "openai/gpt-oss-20b"
      });

    res.json({
      tasks:
        completion.choices[0].message.content
    });

  } catch (error) {

    res.status(500).json({
      error: error.message
    });

  }
});
app.post("/summarize-meeting", async (req, res) => {
  try {

    const { note } = req.body;

    const completion =
      await groq.chat.completions.create({
        messages: [
          {
            role: "user",
            content: `
Summarize this meeting.

Format:

Summary:
Decisions:
Action Items:
Risks:
Next Steps:

Meeting:
${note}
`
          }
        ],
        model: "openai/gpt-oss-20b"
      });

    res.json({
      summary:
        completion.choices[0].message.content
    });

  } catch (error) {

    res.status(500).json({
      error: error.message
    });

  }
});
app.get("/relationship-intelligence", async (req, res) => {
  try {

    const userId = req.query.userId;

const bankId = `meeting-agent-${userId}`;

const recallResult = await hindsight.recall(
  bankId,
  "Client ABC"
);

    const memories = recallResult.results
      .map(item => item.text)
      .join("\n");

    const completion =
      await groq.chat.completions.create({
        messages: [
          {
            role: "user",
            content: `
You are a smart meeting assistant.

Read the meeting memories and create an easy-to-read summary for a normal business user.

Rules:
- Use simple English.
- Keep answers short.
- Avoid technical or consultant language.
- Give practical insights only.
- Use bullet points.

Output format:

Quick Summary:
(2-3 sentences)

What This Client Cares About:
• ...
• ...

Things To Remember:
• ...
• ...

Next Actions:
• ...
• ...

Memories:
${memories}
`
          }
        ],
        model: "openai/gpt-oss-20b"
      });

    res.json({
      analysis:
        completion.choices[0].message.content
    });

  } catch (error) {

    res.status(500).json({
      error: error.message
    });

  }
});
app.get("/followup-email", async (req, res) => {
  try {

    const userId = req.query.userId;

    const bankId = `meeting-agent-${userId}`;

    const recallResult = await hindsight.recall(
      bankId,
      "client meeting proposal dashboard budget"
    );

    const memories = recallResult.results
      .map(item => item.text)
      .join("\n");

    const completion =
      await groq.chat.completions.create({
        messages: [
          {
            role: "user",
            content: `
You are a professional business assistant.

Using the meeting memories below, write a friendly and professional follow-up email.

Requirements:
- Simple English
- Short and readable
- Mention important decisions
- Mention next steps
- Do not invent facts

Memories:
${memories}

Output format:

Subject:

Email:
`
          }
        ],
        model: "openai/gpt-oss-20b"
      });

    res.json({
      email:
        completion.choices[0].message.content
    });

  } catch (error) {

    res.status(500).json({
      error: error.message
    });

  }
});

// ==========================================
// GENERATE FOLLOW-UP EMAIL FOR ONE MEETING
// ==========================================

app.post("/meetings/:id/followup-email", async (req, res) => {
  try {
    const meetingId = req.params.id;
    const { userId } = req.body;

    if (!userId) {
      return res.status(400).json({
        error: "userId is required"
      });
    }

    const meetings = readMeetings();

    const meeting = meetings.find(
      item =>
        item.id === meetingId &&
        item.userId === userId
    );

    if (!meeting) {
      return res.status(404).json({
        error: "Meeting not found"
      });
    }

    const prompt = `
You are an AI meeting assistant.

Write a professional follow-up email based ONLY on this meeting.

Meeting Title:
${meeting.title}

Meeting Date:
${meeting.date}

Participants:
${meeting.participants.join(", ")}

Original Notes:
${meeting.note}

Summary:
${meeting.summary}

Decisions:
${meeting.decisions.join("\n")}

Action Items:
${meeting.actionItems.join("\n")}

Commitments:
${meeting.commitments.join("\n")}

Email requirements:
- Write a professional but friendly follow-up email.
- Thank the participants for their time.
- Briefly summarize the important discussion.
- Mention important decisions.
- Clearly mention action items or next steps.
- Mention dates and deadlines when available.
- Do not invent information.
- Do not add fake names, companies, dates, or commitments.
- Keep the email concise.
- Include a useful subject line.
- Return ONLY the email.
`;

    const completion =
      await groq.chat.completions.create({
        messages: [
          {
            role: "user",
            content: prompt
          }
        ],
        model: "openai/gpt-oss-20b"
      });

    const email =
      completion.choices[0].message.content;

    res.json({
      success: true,
      meetingId,
      email
    });

  } catch (error) {
    console.error(
      "Meeting follow-up email error:",
      error
    );

    res.status(500).json({
      error: error.message
    });
  }
});
app.listen(process.env.PORT || 5000, () => {
  console.log(
    `Server running on port ${process.env.PORT || 5000}`
  );
});