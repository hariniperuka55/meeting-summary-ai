import { useEffect, useState } from "react";
import "./App.css";

const API = "http://localhost:5000";

const navigation = [
  {
    title: "WORKSPACE",
    items: [
      { id: "dashboard", label: "Dashboard", icon: "◫" },
      { id: "meetings", label: "Meetings", icon: "▤" },
      { id: "ask", label: "Ask AI", icon: "✳" },
    ],
  },
  {
    title: "INTELLIGENCE",
    items: [
      { id: "brief", label: "Meeting Brief", icon: "▧" },
      { id: "profile", label: "Client Profile", icon: "♙" },
      { id: "tasks", label: "Pending Tasks", icon: "☑" },
      { id: "insights", label: "Relationship Insights", icon: "⌁" },
      { id: "email", label: "Follow-up Email", icon: "✉" },
    ],
  },
  {
    title: "MEMORY & SYSTEM",
    items: [
      { id: "memory", label: "Memory Explorer", icon: "◈" },
      { id: "system", label: "System Diagnostics", icon: "⌘" },
    ],
  },
];

const pageInfo = {
  dashboard: {
    eyebrow: "YOUR WORKSPACE",
    title: "Meeting intelligence, simplified.",
    description:
      "Turn conversations into searchable knowledge, actionable tasks, and stronger client relationships.",
  },
  meetings: {
    eyebrow: "MEETING WORKSPACE",
    title: "Capture every conversation.",
    description:
      "Create structured meeting records, preserve the details, and ask AI about any conversation.",
  },
  ask: {
    eyebrow: "AI ASSISTANT",
    title: "Ask your meeting memory.",
    description:
      "Ask natural-language questions and get answers grounded in your saved meeting context.",
  },
  brief: {
    eyebrow: "MEETING PREPARATION",
    title: "Walk into every meeting prepared.",
    description:
      "Generate a concise brief using information remembered from previous conversations.",
  },
  profile: {
    eyebrow: "CLIENT INTELLIGENCE",
    title: "Know your clients better.",
    description:
      "Bring together client preferences, budgets, commitments, and relevant context.",
  },
  tasks: {
    eyebrow: "ACTION CENTER",
    title: "Nothing slips through the cracks.",
    description:
      "Surface commitments, outstanding actions, deadlines, and follow-ups from meeting memory.",
  },
  insights: {
    eyebrow: "RELATIONSHIP INTELLIGENCE",
    title: "Find the story behind the meetings.",
    description:
      "Understand client priorities, important dates, relationship context, and next actions.",
  },
  email: {
    eyebrow: "COMMUNICATIONS",
    title: "Make every follow-up count.",
    description:
      "Generate a professional, context-aware follow-up email from your remembered conversations.",
  },
  memory: {
    eyebrow: "PERSISTENT MEMORY",
    title: "Explore what your AI remembers.",
    description:
      "Inspect stored meeting knowledge and run memory operations against your Hindsight bank.",
  },
  system: {
    eyebrow: "DEVELOPER CONSOLE",
    title: "See your AI engine in action.",
    description:
      "Run backend diagnostic endpoints and inspect their actual responses during your demo.",
  },
};

const featureCards = [
  {
    icon: "◈",
    title: "Persistent memory",
    text: "Store and recall meeting context with Hindsight.",
    page: "memory",
    tone: "purple",
  },
  {
    icon: "✳",
    title: "AI-powered answers",
    text: "Use Groq to turn remembered context into useful answers.",
    page: "ask",
    tone: "blue",
  },
  {
    icon: "☑",
    title: "Action intelligence",
    text: "Discover outstanding commitments and next steps.",
    page: "tasks",
    tone: "green",
  },
  {
    icon: "⌁",
    title: "Client relationships",
    text: "Turn meeting history into actionable client insights.",
    page: "insights",
    tone: "orange",
  },
];

function Icon({ children }) {
  return (
    <span className="ui-icon" aria-hidden="true">
      {children}
    </span>
  );
}

function ActionButton({
  children,
  onClick,
  variant = "primary",
  disabled = false,
  type = "button",
}) {
  return (
    <button
      type={type}
      className={`action-button ${variant}`}
      onClick={onClick}
      disabled={disabled}
    >
      {children}
    </button>
  );
}

//
// ==========================================
// CLIENT PROFILE RESULT
// ==========================================
// Converts the AI's Markdown-like response
// into a polished CRM-style profile.
//

function ClientProfileResult({ result }) {
  if (!result) return null;

  const lines = String(result)
    .split("\n")
    .map((line) => line.trim())
    .filter(Boolean);

  const cleanMarkdown = (text) =>
    text
      .replace(/\*\*/g, "")
      .replace(/^#+\s*/, "")
      .trim();

  const isHeading = (text) => {
    const lower = text.toLowerCase();

    return (
      lower.includes("client snapshot") ||
      lower.includes("important notes") ||
      lower.includes("things to watch") ||
      lower.includes("upcoming") ||
      lower.includes("next actions") ||
      lower.includes("what this client cares about")
    );
  };

  const getHeadingIcon = (text) => {
    const lower = text.toLowerCase();

    if (lower.includes("client snapshot")) return "◎";
    if (lower.includes("important notes")) return "📌";
    if (lower.includes("things to watch")) return "⚠";
    if (lower.includes("upcoming")) return "◷";
    if (lower.includes("next actions")) return "↗";
    if (lower.includes("what this client cares about")) return "✦";

    return "✦";
  };

  const isBullet = (text) =>
    text.startsWith("•") ||
    text.startsWith("-") ||
    text.startsWith("*");

  const removeBullet = (text) =>
    text.replace(/^[•\-*]\s*/, "").trim();

  const labelValue = (text) => {
    const colonIndex = text.indexOf(":");

    if (colonIndex === -1) {
      return null;
    }

    const label = text.slice(0, colonIndex).trim();
    const value = text.slice(colonIndex + 1).trim();

    if (!label || !value) {
      return null;
    }

    return { label, value };
  };

  return (
    <div
      style={{
        display: "grid",
        gap: "22px",
      }}
    >
      {lines.map((rawLine, index) => {
        const line = cleanMarkdown(rawLine);

        if (!line) return null;

        //
        // SECTION HEADING
        //
        if (isHeading(line)) {
          return (
            <div
              key={`${line}-${index}`}
              style={{
                display: "flex",
                alignItems: "center",
                gap: "12px",
                marginTop: index === 0 ? 0 : "8px",
                paddingBottom: "10px",
                borderBottom: "1px solid #eeeaf5",
              }}
            >
              <div
                style={{
                  width: "36px",
                  height: "36px",
                  borderRadius: "11px",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  background:
                    "linear-gradient(135deg, #f0ebff, #e9f0ff)",
                  color: "#715fe0",
                  fontSize: "17px",
                  flexShrink: 0,
                }}
              >
                {getHeadingIcon(line)}
              </div>

              <h3
                style={{
                  margin: 0,
                  color: "#302b55",
                  fontSize: "17px",
                  fontWeight: 700,
                }}
              >
                {line}
              </h3>
            </div>
          );
        }

        //
        // BULLET ITEM
        //
        if (isBullet(line)) {
          return (
            <div
              key={`${line}-${index}`}
              style={{
                display: "flex",
                alignItems: "flex-start",
                gap: "12px",
                padding: "12px 14px",
                borderRadius: "12px",
                background: "#faf9ff",
                border: "1px solid #eeeafd",
                color: "#4d496b",
                lineHeight: 1.6,
              }}
            >
              <span
                style={{
                  width: "8px",
                  height: "8px",
                  borderRadius: "50%",
                  background: "#7664e8",
                  marginTop: "8px",
                  flexShrink: 0,
                }}
              />

              <span>{removeBullet(line)}</span>
            </div>
          );
        }

        //
        // LABEL + VALUE
        //
        const parsed = labelValue(line);

        if (parsed) {
          const lowerLabel = parsed.label.toLowerCase();

          let icon = "•";

          if (lowerLabel.includes("budget")) {
            icon = "💰";
          } else if (
            lowerLabel.includes("interest") ||
            lowerLabel.includes("care")
          ) {
            icon = "🎯";
          } else if (
            lowerLabel.includes("name") ||
            lowerLabel.includes("client")
          ) {
            icon = "◎";
          } else if (
            lowerLabel.includes("date") ||
            lowerLabel.includes("deadline")
          ) {
            icon = "◷";
          }

          return (
            <div
              key={`${line}-${index}`}
              style={{
                display: "grid",
                gridTemplateColumns:
                  "minmax(150px, 190px) 1fr",
                alignItems: "center",
                gap: "18px",
                padding: "14px 0",
                borderBottom: "1px solid #f0eef7",
              }}
            >
              <div
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: "9px",
                  color: "#706b82",
                  fontSize: "13px",
                  fontWeight: 700,
                  textTransform: "uppercase",
                  letterSpacing: "0.04em",
                }}
              >
                <span>{icon}</span>
                <span>{parsed.label}</span>
              </div>

              <div
                style={{
                  color: "#302b55",
                  fontSize: "15px",
                  fontWeight: 500,
                  lineHeight: 1.6,
                }}
              >
                {parsed.value}
              </div>
            </div>
          );
        }

        //
        // NORMAL TEXT
        //
        return (
          <div
            key={`${line}-${index}`}
            style={{
              color: "#555261",
              fontSize: "15px",
              lineHeight: 1.7,
            }}
          >
            {line}
          </div>
        );
      })}
    </div>
  );
}

//
// ==========================================
// RESULT PANEL
// ==========================================
// Client Profile gets a special polished view.
// Other endpoints continue using the normal
// text/JSON result rendering.
//

function ResultPanel({ title, result, loading, onClear }) {
  if (!result && !loading) return null;

  const isClientProfile = title === "Client profile";

  return (
    <section className="result-panel">
      <div className="result-heading">
        <div className="result-heading-left">
          <span className="result-sparkle">✳</span>

          <div>
            <h3>
              {loading
                ? "Working on it..."
                : title || "AI response"}
            </h3>

            <p>
              {loading
                ? "Waiting for your backend to respond."
                : isClientProfile
                ? "AI-generated client intelligence from your meeting memory"
                : "Response from your Meeting Agent backend"}
            </p>
          </div>
        </div>

        {!loading && (
          <button className="text-button" onClick={onClear}>
            Clear
          </button>
        )}
      </div>

      {loading ? (
        <div className="loading-area">
          <span className="spinner" />
          <span>Processing your request...</span>
        </div>
      ) : (
        <div className="result-content">
          {isClientProfile ? (
            <ClientProfileResult result={result} />
          ) : typeof result === "string" ? (
            <div className="result-text">{result}</div>
          ) : (
            <pre className="result-json">
              {JSON.stringify(result, null, 2)}
            </pre>
          )}
        </div>
      )}
    </section>
  );
}

function FieldLabel({ children }) {
  return <label className="field-label">{children}</label>;
}

function MeetingPill({ children }) {
  return (
    <span
      style={{
        display: "inline-flex",
        alignItems: "center",
        gap: "6px",
        padding: "6px 10px",
        borderRadius: "999px",
        background: "#f4f1ff",
        color: "#6654c5",
        fontSize: "12px",
        fontWeight: 700,
      }}
    >
      {children}
    </span>
  );
}

export default function App() {
  const [page, setPage] = useState("dashboard");

  const [userId, setUserId] = useState("priya");

  const [note, setNote] = useState("");
  const [question, setQuestion] = useState("");
  const [clientName, setClientName] = useState("Client ABC");

  const [result, setResult] = useState(null);
  const [resultTitle, setResultTitle] = useState("");

  const [loading, setLoading] = useState(false);
  const [lastAction, setLastAction] = useState("");
  const [error, setError] = useState("");
  const [history, setHistory] = useState([]);

  // ==========================================
  // MEETING STATE
  // ==========================================

  const [meetings, setMeetings] = useState([]);
  const [meetingsLoading, setMeetingsLoading] = useState(false);
  const [selectedMeeting, setSelectedMeeting] = useState(null);
  const [meetingDetailLoading, setMeetingDetailLoading] =
    useState(false);

  const [meetingTitle, setMeetingTitle] = useState("");
  const [meetingDate, setMeetingDate] = useState("");
  const [meetingParticipants, setMeetingParticipants] =
    useState("");

  const [meetingQuestion, setMeetingQuestion] = useState("");
  const [meetingAnswer, setMeetingAnswer] = useState("");
  const [meetingAskLoading, setMeetingAskLoading] =
    useState(false);

  // Follow-up email state
  const [followupEmail, setFollowupEmail] = useState("");
  const [followupEmailLoading, setFollowupEmailLoading] =
    useState(false);

  const currentPage =
    pageInfo[page] || pageInfo.dashboard;

  // ==========================================
  // GENERIC REQUEST HELPERS
  // ==========================================

  const recordResult = (title, data) => {
    setResult(data);
    setResultTitle(title);
    setLastAction(title);

    setHistory((previous) =>
      [
        {
          title,
          time: new Date().toLocaleTimeString([], {
            hour: "2-digit",
            minute: "2-digit",
          }),
        },
        ...previous,
      ].slice(0, 5)
    );
  };

  const request = async (title, operation) => {
    if (!userId.trim()) {
      setError("Enter a User ID before running this action.");
      return;
    }

    try {
      setLoading(true);
      setError("");
      setResult(null);

      const data = await operation();

      if (data && data.error) {
        throw new Error(
          typeof data.error === "string"
            ? data.error
            : JSON.stringify(data.error)
        );
      }

      recordResult(title, data);
    } catch (err) {
      setError(
        `${
          err.message || "Something went wrong."
        } Check that your backend is running at ${API}.`
      );
    } finally {
      setLoading(false);
    }
  };

  const getJSON = async (url, options) => {
    const response = await fetch(url, options);
    const raw = await response.text();

    let data;

    try {
      data = raw ? JSON.parse(raw) : {};
    } catch {
      data = {
        response:
          raw ||
          "The server returned an empty response.",
      };
    }

    if (!response.ok) {
      throw new Error(
        data.error ||
          data.message ||
          `Request failed (${response.status})`
      );
    }

    return data;
  };

  const loadEndpoint = (path, field, title) =>
    request(title, async () => {
      const data = await getJSON(
        `${API}${path}${
          path.includes("?") ? "&" : "?"
        }userId=${encodeURIComponent(userId.trim())}`
      );

      return field && data[field] !== undefined
        ? data[field]
        : data;
    });

  const postJSON = (path, body, field, title) =>
    request(title, async () => {
      const data = await getJSON(`${API}${path}`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(body),
      });

      return field && data[field] !== undefined
        ? data[field]
        : data;
    });

  // ==========================================
  // LOAD MEETINGS
  // ==========================================

  const loadMeetings = async (showErrors = true) => {
    if (!userId.trim()) {
      if (showErrors) {
        setError(
          "Enter a User ID before loading meetings."
        );
      }
      return;
    }

    try {
      setMeetingsLoading(true);

      if (showErrors) {
        setError("");
      }

      const data = await getJSON(
        `${API}/meetings?userId=${encodeURIComponent(
          userId.trim()
        )}`
      );

      setMeetings(
        Array.isArray(data)
          ? data
          : data.meetings || []
      );
    } catch (err) {
      if (showErrors) {
        setError(
          `${
            err.message ||
            "Could not load meetings."
          } Check that your backend is running at ${API}.`
        );
      }
    } finally {
      setMeetingsLoading(false);
    }
  };

  useEffect(() => {
    if (page === "meetings") {
      setSelectedMeeting(null);
      setMeetingAnswer("");
      setMeetingQuestion("");
      setFollowupEmail("");
      loadMeetings();
    }
  }, [page, userId]);

  // ==========================================
  // CREATE STRUCTURED MEETING
  // ==========================================

  const createMeeting = async () => {
    if (!userId.trim()) {
      setError("Enter a User ID first.");
      return;
    }

    if (!meetingTitle.trim()) {
      setError("Enter a meeting title.");
      return;
    }

    if (!note.trim()) {
      setError(
        "Add some meeting notes before creating the meeting."
      );
      return;
    }

    try {
      setLoading(true);
      setError("");
      setResult(null);

      const participants = meetingParticipants
        .split(",")
        .map((person) => person.trim())
        .filter(Boolean);

      const data = await getJSON(`${API}/meetings`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          userId: userId.trim(),
          title: meetingTitle.trim(),
          date:
            meetingDate ||
            new Date().toISOString().split("T")[0],
          participants,
          note: note.trim(),
        }),
      });

      const createdMeeting =
        data.meeting || data;

      setMeetings((previous) => [
        createdMeeting,
        ...previous,
      ]);

      setSelectedMeeting(createdMeeting);

      setMeetingTitle("");
      setMeetingDate("");
      setMeetingParticipants("");
      setNote("");

      setFollowupEmail("");
      setMeetingAnswer("");
      setMeetingQuestion("");

      recordResult(
        "Create structured meeting",
        {
          success: true,
          meeting: createdMeeting,
        }
      );
    } catch (err) {
      setError(
        `${
          err.message ||
          "Could not create meeting."
        } Check that your backend is running at ${API}.`
      );
    } finally {
      setLoading(false);
    }
  };

  // ==========================================
  // OPEN ONE MEETING
  // ==========================================

  const openMeeting = async (meeting) => {
    if (!meeting?.id) return;

    try {
      setMeetingDetailLoading(true);
      setError("");
      setMeetingAnswer("");
      setMeetingQuestion("");
      setFollowupEmail("");

      const data = await getJSON(
        `${API}/meetings/${encodeURIComponent(
          meeting.id
        )}?userId=${encodeURIComponent(
          userId.trim()
        )}`
      );

      setSelectedMeeting(
        data.meeting || data
      );
    } catch (err) {
      setError(
        err.message ||
          "Could not load the selected meeting."
      );
    } finally {
      setMeetingDetailLoading(false);
    }
  };

  // ==========================================
  // ASK AI ABOUT ONE MEETING
  // ==========================================

  const askAboutMeeting = async () => {
    if (!selectedMeeting?.id) {
      setError("Select a meeting first.");
      return;
    }

    if (!meetingQuestion.trim()) {
      setError(
        "Type a question about this meeting."
      );
      return;
    }

    try {
      setMeetingAskLoading(true);
      setError("");
      setMeetingAnswer("");

      const data = await getJSON(
        `${API}/meetings/${encodeURIComponent(
          selectedMeeting.id
        )}/ask`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            userId: userId.trim(),
            question: meetingQuestion.trim(),
          }),
        }
      );

      setMeetingAnswer(
        data.answer || "No answer returned."
      );

      setHistory((previous) =>
        [
          {
            title: `Ask AI · ${selectedMeeting.title}`,
            time: new Date().toLocaleTimeString(
              [],
              {
                hour: "2-digit",
                minute: "2-digit",
              }
            ),
          },
          ...previous,
        ].slice(0, 5)
      );
    } catch (err) {
      setError(
        err.message ||
          "Could not ask AI about this meeting."
      );
    } finally {
      setMeetingAskLoading(false);
    }
  };

  // ==========================================
  // GENERATE FOLLOW-UP EMAIL FOR ONE MEETING
  // ==========================================

  const generateMeetingFollowupEmail =
    async () => {
      if (!selectedMeeting?.id) {
        setError("Select a meeting first.");
        return;
      }

      try {
        setFollowupEmailLoading(true);
        setError("");
        setFollowupEmail("");

        const data = await getJSON(
          `${API}/meetings/${encodeURIComponent(
            selectedMeeting.id
          )}/followup-email`,
          {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
            },
            body: JSON.stringify({
              userId: userId.trim(),
            }),
          }
        );

        setFollowupEmail(
          data.email ||
            "No email was generated."
        );

        setHistory((previous) =>
          [
            {
              title: `Follow-up email · ${selectedMeeting.title}`,
              time: new Date().toLocaleTimeString(
                [],
                {
                  hour: "2-digit",
                  minute: "2-digit",
                }
              ),
            },
            ...previous,
          ].slice(0, 5)
        );
      } catch (err) {
        setError(
          err.message ||
            "Could not generate the follow-up email."
        );
      } finally {
        setFollowupEmailLoading(false);
      }
    };

  // ==========================================
  // EXISTING ACTIONS
  // ==========================================

  const saveMeeting = () => {
    if (!note.trim()) {
      setError(
        "Add some meeting notes before saving."
      );
      return;
    }

    postJSON(
      "/saveMeeting",
      {
        userId: userId.trim(),
        note: note.trim(),
      },
      null,
      "Save meeting to memory"
    );
  };

  const summarizeMeeting = () => {
    if (!note.trim()) {
      setError(
        "Paste meeting notes before generating a summary."
      );
      return;
    }

    postJSON(
      "/summarize-meeting",
      {
        note: note.trim(),
      },
      "summary",
      "Summarize meeting"
    );
  };

  const askAI = () => {
    if (!question.trim()) {
      setError(
        "Type a question to ask your AI assistant."
      );
      return;
    }

    postJSON(
      "/ask",
      {
        userId: userId.trim(),
        question: question.trim(),
      },
      "answer",
      "Ask AI"
    );
  };

  const runMemoryDiagnostic = (
    endpoint,
    title
  ) => {
    loadEndpoint(endpoint, null, title);
  };

  // ==========================================
  // DASHBOARD
  // ==========================================

  const renderDashboard = () => (
    <>
      <section className="hero-card">
        <div className="hero-copy">
          <span className="hero-badge">
            <span className="status-dot" /> AI MEETING
            WORKSPACE
          </span>

          <h2>
            Better meetings.
            <br />
            <span>Smarter relationships.</span>
          </h2>

          <p>
            Your conversations contain valuable
            knowledge. MeetMind helps you capture it,
            remember it, and turn it into action.
          </p>

          <div className="hero-actions">
            <ActionButton
              onClick={() => setPage("meetings")}
            >
              + Save a meeting
            </ActionButton>

            <ActionButton
              variant="secondary"
              onClick={() => setPage("ask")}
            >
              <Icon>✳</Icon> Ask your AI
            </ActionButton>
          </div>
        </div>

        <div
          className="hero-art"
          aria-hidden="true"
        >
          <div className="orbit orbit-one" />
          <div className="orbit orbit-two" />
          <div className="orbit orbit-three" />

          <div className="orbit-core">
            <span>✳</span>
          </div>

          <div className="floating-chip chip-one">
            Memory connected
          </div>

          <div className="floating-chip chip-two">
            AI insights
          </div>

          <div className="floating-chip chip-three">
            Next actions
          </div>
        </div>
      </section>

      <div className="section-heading">
        <div>
          <h2>Your intelligence toolkit</h2>

          <p>
            Everything you need to move from
            conversation to action.
          </p>
        </div>
      </div>

      <div className="feature-grid">
        {featureCards.map((card) => (
          <button
            key={card.page}
            className="feature-card"
            onClick={() => setPage(card.page)}
          >
            <div
              className={`feature-icon ${card.tone}`}
            >
              {card.icon}
            </div>

            <h3>{card.title}</h3>

            <p>{card.text}</p>

            <span className="feature-link">
              Open workspace <span>↗</span>
            </span>
          </button>
        ))}
      </div>

      <div className="dashboard-columns">
        <section className="surface-card">
          <div className="section-heading compact">
            <div>
              <h2>Backend services</h2>
              <p>
                Configured integrations for this
                project.
              </p>
            </div>

            <span className="soft-badge">
              Local demo
            </span>
          </div>

          <div className="service-row">
            <div className="service-symbol purple">
              ◈
            </div>

            <div className="service-copy">
              <strong>Hindsight Memory</strong>

              <span>
                Persistent meeting recall and
                retention
              </span>
            </div>

            <span className="service-label">
              Configured
            </span>
          </div>

          <div className="service-row">
            <div className="service-symbol blue">
              ✳
            </div>

            <div className="service-copy">
              <strong>Groq AI</strong>

              <span>
                Answers, summaries, and generated
                insights
              </span>
            </div>

            <span className="service-label">
              Configured
            </span>
          </div>

          <div className="service-row">
            <div className="service-symbol green">
              ⇄
            </div>

            <div className="service-copy">
              <strong>Express API</strong>

              <span>
                Backend endpoint at localhost:5000
              </span>
            </div>

            <span className="service-label">
              Local
            </span>
          </div>

          <p className="muted-note">
            These labels describe your configured
            integrations, not a live health check.
            Run System Diagnostics to test actual
            endpoints.
          </p>

          <ActionButton
            variant="secondary"
            onClick={() => setPage("system")}
          >
            Run system diagnostics →
          </ActionButton>
        </section>

        <section className="surface-card">
          <div className="section-heading compact">
            <div>
              <h2>Recent activity</h2>

              <p>Actions from this session.</p>
            </div>

            <span className="activity-count">
              {history.length}
            </span>
          </div>

          {history.length ? (
            <div className="activity-list">
              {history.map((item, index) => (
                <div
                  className="activity-item"
                  key={`${item.title}-${index}`}
                >
                  <span className="activity-mark">
                    ✓
                  </span>

                  <div className="activity-copy">
                    <strong>{item.title}</strong>

                    <span>
                      Request completed ·{" "}
                      {item.time}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="empty-state">
              <div className="empty-icon">◷</div>

              <h3>
                Your activity will appear here
              </h3>

              <p>
                Save a meeting or run an AI action
                to get started.
              </p>
            </div>
          )}
        </section>
      </div>

      <section className="surface-card quick-start">
        <div>
          <span className="eyebrow">
            GET STARTED
          </span>

          <h2>Have meeting notes ready?</h2>

          <p>
            Save your first conversation and build
            your searchable memory.
          </p>
        </div>

        <ActionButton
          onClick={() => setPage("meetings")}
        >
          Open meeting workspace →
        </ActionButton>
      </section>
    </>
  );

  // ==========================================
  // MEETINGS PAGE
  // ==========================================

  const renderMeetings = () => (
    <>
      {!selectedMeeting ? (
        <div className="workspace-grid">
          <section className="surface-card">
            <div className="card-title-row">
              <div className="feature-icon purple">
                ▤
              </div>

              <div>
                <h2>Create a meeting</h2>

                <p>
                  Turn your notes into a structured,
                  AI-powered meeting record.
                </p>
              </div>
            </div>

            <div className="form-field">
              <FieldLabel>
                Meeting title
              </FieldLabel>

              <input
                value={meetingTitle}
                onChange={(e) =>
                  setMeetingTitle(
                    e.target.value
                  )
                }
                placeholder="Example: Client ABC project discussion"
              />
            </div>

            <div
              style={{
                display: "grid",
                gridTemplateColumns:
                  "1fr 1fr",
                gap: "16px",
                marginBottom: "18px",
              }}
            >
              <div className="form-field">
                <FieldLabel>Date</FieldLabel>

                <input
                  type="date"
                  value={meetingDate}
                  onChange={(e) =>
                    setMeetingDate(
                      e.target.value
                    )
                  }
                />
              </div>

              <div className="form-field">
                <FieldLabel>
                  Participants
                </FieldLabel>

                <input
                  value={meetingParticipants}
                  onChange={(e) =>
                    setMeetingParticipants(
                      e.target.value
                    )
                  }
                  placeholder="Priya, Client ABC, John"
                />
              </div>
            </div>

            <FieldLabel>
              Meeting notes
            </FieldLabel>

            <textarea
              className="notes-input"
              value={note}
              onChange={(e) =>
                setNote(e.target.value)
              }
              placeholder={
                "Example:\nMet with Client ABC to discuss the dashboard project.\nBudget: $50k.\nClient prefers a simple dashboard.\nSend the proposal by October 2.\nSchedule a demo for October 6."
              }
              rows={11}
            />

            <div className="input-footer">
              <span>
                {note.trim()
                  ? note
                      .trim()
                      .split(/\s+/).length
                  : 0}{" "}
                words
              </span>

              <span>
                User:{" "}
                {userId || "Not selected"}
              </span>
            </div>

            <div className="button-row">
              <ActionButton
                onClick={createMeeting}
                disabled={loading}
              >
                ✦ Create meeting with AI
              </ActionButton>

              <ActionButton
                variant="secondary"
                onClick={summarizeMeeting}
                disabled={loading}
              >
                ✳ Quick summarize
              </ActionButton>
            </div>
          </section>

          <section className="surface-card side-info">
            <span className="eyebrow">
              MEETING WORKFLOW
            </span>

            <h2>
              From conversation
              <br />
              to intelligence.
            </h2>

            <div className="workflow-step">
              <span className="step-number">
                01
              </span>

              <div>
                <strong>Capture</strong>

                <p>
                  Add the title, participants,
                  date, and meeting notes.
                </p>
              </div>
            </div>

            <div className="workflow-step">
              <span className="step-number">
                02
              </span>

              <div>
                <strong>Understand</strong>

                <p>
                  Groq extracts the summary,
                  decisions, actions, and
                  commitments.
                </p>
              </div>
            </div>

            <div className="workflow-step">
              <span className="step-number">
                03
              </span>

              <div>
                <strong>Remember</strong>

                <p>
                  The meeting is stored and its
                  knowledge is retained in
                  Hindsight.
                </p>
              </div>
            </div>

            <div className="workflow-step">
              <span className="step-number">
                04
              </span>

              <div>
                <strong>Ask</strong>

                <p>
                  Open the meeting later and ask
                  AI questions specifically about
                  that conversation.
                </p>
              </div>
            </div>

            <div className="info-callout">
              <span>✦</span>

              <p>
                Creating a meeting is now your
                structured workflow. The backend
                generates the intelligence
                automatically.
              </p>
            </div>
          </section>
        </div>
      ) : (
        renderMeetingDetail()
      )}

      <section
        className="surface-card"
        style={{ marginTop: "24px" }}
      >
        <div className="section-heading compact">
          <div>
            <h2>Your meetings</h2>

            <p>
              Structured conversations stored for{" "}
              <strong>{userId}</strong>.
            </p>
          </div>

          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: "10px",
            }}
          >
            <span className="activity-count">
              {meetings.length}
            </span>

            <button
              className="text-button"
              onClick={() => loadMeetings()}
              disabled={meetingsLoading}
            >
              {meetingsLoading
                ? "Refreshing..."
                : "Refresh"}
            </button>
          </div>
        </div>

        {meetingsLoading ? (
          <div className="loading-area">
            <span className="spinner" />
            <span>
              Loading your meetings...
            </span>
          </div>
        ) : meetings.length === 0 ? (
          <div className="empty-state">
            <div className="empty-icon">▤</div>

            <h3>
              No structured meetings yet
            </h3>

            <p>
              Create your first meeting above and
              it will appear here.
            </p>
          </div>
        ) : (
          <div
            style={{
              display: "grid",
              gap: "12px",
            }}
          >
            {meetings.map((meeting) => (
              <button
                key={meeting.id}
                onClick={() =>
                  openMeeting(meeting)
                }
                style={{
                  width: "100%",
                  textAlign: "left",
                  border:
                    "1px solid #e8e5ef",
                  background: "#ffffff",
                  borderRadius: "16px",
                  padding: "18px",
                  cursor: "pointer",
                  transition:
                    "all 0.2s ease",
                  display: "flex",
                  justifyContent:
                    "space-between",
                  alignItems: "center",
                  gap: "20px",
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.borderColor =
                    "#c9c0f3";

                  e.currentTarget.style.transform =
                    "translateY(-1px)";
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.borderColor =
                    "#e8e5ef";

                  e.currentTarget.style.transform =
                    "translateY(0)";
                }}
              >
                <div style={{ minWidth: 0 }}>
                  <div
                    style={{
                      display: "flex",
                      alignItems: "center",
                      gap: "10px",
                      marginBottom: "8px",
                      flexWrap: "wrap",
                    }}
                  >
                    <strong
                      style={{
                        fontSize: "16px",
                        color: "#20202a",
                      }}
                    >
                      {meeting.title}
                    </strong>

                    {meeting.date && (
                      <MeetingPill>
                        ◷ {meeting.date}
                      </MeetingPill>
                    )}
                  </div>

                  <p
                    style={{
                      margin: 0,
                      color: "#777483",
                      fontSize: "13px",
                      lineHeight: 1.5,
                    }}
                  >
                    {meeting.summary ||
                      meeting.note ||
                      "Meeting details available"}
                  </p>

                  {meeting.participants
                    ?.length > 0 && (
                    <div
                      style={{
                        marginTop: "10px",
                        color: "#918d9d",
                        fontSize: "12px",
                      }}
                    >
                      👥{" "}
                      {meeting.participants.join(
                        ", "
                      )}
                    </div>
                  )}
                </div>

                <span
                  style={{
                    fontSize: "20px",
                    color: "#8b82aa",
                    flexShrink: 0,
                  }}
                >
                  →
                </span>
              </button>
            ))}
          </div>
        )}
      </section>
    </>
  );

  // ==========================================
  // MEETING DETAIL
  // ==========================================

  const renderMeetingDetail = () => {
    if (meetingDetailLoading) {
      return (
        <section className="surface-card">
          <div className="loading-area">
            <span className="spinner" />

            <span>
              Loading meeting details...
            </span>
          </div>
        </section>
      );
    }

    if (!selectedMeeting) return null;

    const decisions = Array.isArray(
      selectedMeeting.decisions
    )
      ? selectedMeeting.decisions
      : [];

    const actionItems = Array.isArray(
      selectedMeeting.actionItems
    )
      ? selectedMeeting.actionItems
      : [];

    const commitments = Array.isArray(
      selectedMeeting.commitments
    )
      ? selectedMeeting.commitments
      : [];

    return (
      <div>
        <button
          className="text-button"
          onClick={() => {
            setSelectedMeeting(null);
            setMeetingAnswer("");
            setMeetingQuestion("");
            setFollowupEmail("");
          }}
          style={{ marginBottom: "16px" }}
        >
          ← Back to all meetings
        </button>

        <section className="surface-card">
          <div
            style={{
              display: "flex",
              justifyContent:
                "space-between",
              alignItems: "flex-start",
              gap: "20px",
              flexWrap: "wrap",
              marginBottom: "24px",
            }}
          >
            <div>
              <span className="eyebrow">
                MEETING RECORD
              </span>

              <h2
                style={{
                  margin: "6px 0 8px",
                  fontSize: "30px",
                }}
              >
                {selectedMeeting.title}
              </h2>

              <div
                style={{
                  display: "flex",
                  gap: "8px",
                  flexWrap: "wrap",
                }}
              >
                {selectedMeeting.date && (
                  <MeetingPill>
                    ◷ {selectedMeeting.date}
                  </MeetingPill>
                )}

                <MeetingPill>
                  ◈ {userId}
                </MeetingPill>

                {selectedMeeting
                  .participants?.length >
                  0 && (
                  <MeetingPill>
                    👥{" "}
                    {
                      selectedMeeting
                        .participants
                        .length
                    }{" "}
                    participant
                    {selectedMeeting
                      .participants
                      .length !== 1
                      ? "s"
                      : ""}
                  </MeetingPill>
                )}
              </div>
            </div>

            <div className="feature-icon purple">
              ✳
            </div>
          </div>

          <div
            style={{
              display: "grid",
              gridTemplateColumns:
                "repeat(auto-fit, minmax(220px, 1fr))",
              gap: "14px",
              marginBottom: "24px",
            }}
          >
            <div
              style={{
                padding: "18px",
                borderRadius: "14px",
                background: "#faf9fd",
                border:
                  "1px solid #eeeaf5",
              }}
            >
              <span className="eyebrow">
                SUMMARY
              </span>

              <p
                style={{
                  margin: "8px 0 0",
                  lineHeight: 1.7,
                  color: "#555261",
                }}
              >
                {selectedMeeting.summary ||
                  "No summary available."}
              </p>
            </div>

            <div
              style={{
                padding: "18px",
                borderRadius: "14px",
                background: "#faf9fd",
                border:
                  "1px solid #eeeaf5",
              }}
            >
              <span className="eyebrow">
                PARTICIPANTS
              </span>

              <p
                style={{
                  margin: "8px 0 0",
                  lineHeight: 1.7,
                  color: "#555261",
                }}
              >
                {selectedMeeting
                  .participants?.length
                  ? selectedMeeting
                      .participants.join(", ")
                  : "No participants recorded."}
              </p>
            </div>
          </div>

          <div
            style={{
              display: "grid",
              gridTemplateColumns:
                "repeat(auto-fit, minmax(260px, 1fr))",
              gap: "14px",
            }}
          >
            <div
              style={{
                padding: "18px",
                borderRadius: "14px",
                border:
                  "1px solid #eeeaf5",
              }}
            >
              <h3
                style={{
                  marginTop: 0,
                  marginBottom: "12px",
                }}
              >
                ◉ Decisions
              </h3>

              {decisions.length ? (
                <ul
                  style={{
                    margin: 0,
                    paddingLeft: "20px",
                    lineHeight: 1.8,
                    color: "#5c5965",
                  }}
                >
                  {decisions.map(
                    (item, index) => (
                      <li key={index}>
                        {item}
                      </li>
                    )
                  )}
                </ul>
              ) : (
                <p className="muted-note">
                  No decisions recorded.
                </p>
              )}
            </div>

            <div
              style={{
                padding: "18px",
                borderRadius: "14px",
                border:
                  "1px solid #eeeaf5",
              }}
            >
              <h3
                style={{
                  marginTop: 0,
                  marginBottom: "12px",
                }}
              >
                ☑ Action items
              </h3>

              {actionItems.length ? (
                <ul
                  style={{
                    margin: 0,
                    paddingLeft: "20px",
                    lineHeight: 1.8,
                    color: "#5c5965",
                  }}
                >
                  {actionItems.map(
                    (item, index) => (
                      <li key={index}>
                        {item}
                      </li>
                    )
                  )}
                </ul>
              ) : (
                <p className="muted-note">
                  No action items recorded.
                </p>
              )}
            </div>

            <div
              style={{
                padding: "18px",
                borderRadius: "14px",
                border:
                  "1px solid #eeeaf5",
              }}
            >
              <h3
                style={{
                  marginTop: 0,
                  marginBottom: "12px",
                }}
              >
                ↗ Commitments
              </h3>

              {commitments.length ? (
                <ul
                  style={{
                    margin: 0,
                    paddingLeft: "20px",
                    lineHeight: 1.8,
                    color: "#5c5965",
                  }}
                >
                  {commitments.map(
                    (item, index) => (
                      <li key={index}>
                        {item}
                      </li>
                    )
                  )}
                </ul>
              ) : (
                <p className="muted-note">
                  No commitments recorded.
                </p>
              )}
            </div>
          </div>
        </section>

        {/* ==========================================
            ASK AI + FOLLOW-UP EMAIL
        ========================================== */}

        <section
          className="surface-card"
          style={{ marginTop: "20px" }}
        >
          <div className="card-title-row">
            <div className="feature-icon blue">
              ✳
            </div>

            <div>
              <h2>
                Meeting AI assistant
              </h2>

              <p>
                Ask questions about this meeting
                or generate a follow-up email
                from the exact meeting context.
              </p>
            </div>
          </div>

          <div className="chat-input-wrap">
            <textarea
              value={meetingQuestion}
              onChange={(e) =>
                setMeetingQuestion(
                  e.target.value
                )
              }
              placeholder="Example: What did the client care about most?"
              rows={3}
              onKeyDown={(e) => {
                if (
                  e.key === "Enter" &&
                  !e.shiftKey
                ) {
                  e.preventDefault();
                  askAboutMeeting();
                }
              }}
            />

            <div className="chat-input-footer">
              <span>
                Enter to ask · Shift + Enter for
                a new line
              </span>

              <ActionButton
                onClick={askAboutMeeting}
                disabled={meetingAskLoading}
              >
                {meetingAskLoading
                  ? "Thinking..."
                  : "Ask about meeting ↑"}
              </ActionButton>

              <ActionButton
                variant="secondary"
                onClick={
                  generateMeetingFollowupEmail
                }
                disabled={
                  followupEmailLoading
                }
              >
                {followupEmailLoading
                  ? "Generating email..."
                  : "✉ Generate Follow-up Email"}
              </ActionButton>
            </div>

            {/* AI ANSWER */}

            {meetingAnswer && (
              <div
                style={{
                  marginTop: "20px",
                  padding: "20px",
                  borderRadius: "16px",
                  background:
                    "linear-gradient(135deg, #faf9ff, #f5f8ff)",
                  border:
                    "1px solid #e7e4f3",
                }}
              >
                <div
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: "10px",
                    marginBottom: "10px",
                  }}
                >
                  <span className="result-sparkle">
                    ✳
                  </span>

                  <strong>
                    MeetMind answer
                  </strong>
                </div>

                <div
                  style={{
                    color: "#45424f",
                    lineHeight: 1.75,
                    whiteSpace: "pre-wrap",
                  }}
                >
                  {meetingAnswer}
                </div>
              </div>
            )}

            {/* FOLLOW-UP EMAIL */}

            {followupEmail && (
              <div
                style={{
                  marginTop: "20px",
                  padding: "20px",
                  borderRadius: "16px",
                  background:
                    "linear-gradient(135deg, #faf9ff, #f5f8ff)",
                  border:
                    "1px solid #e7e4f3",
                }}
              >
                <div
                  style={{
                    display: "flex",
                    justifyContent:
                      "space-between",
                    alignItems: "center",
                    gap: "12px",
                    marginBottom: "14px",
                  }}
                >
                  <div>
                    <span className="eyebrow">
                      AI GENERATED
                    </span>

                    <h3
                      style={{
                        margin: "4px 0 0",
                      }}
                    >
                      Follow-up Email
                    </h3>
                  </div>

                  <button
                    className="text-button"
                    onClick={() => {
                      navigator.clipboard
                        .writeText(
                          followupEmail
                        )
                        .then(() => {
                          setHistory(
                            (previous) =>
                              [
                                {
                                  title:
                                    "Copy follow-up email",
                                  time: new Date().toLocaleTimeString(
                                    [],
                                    {
                                      hour: "2-digit",
                                      minute:
                                        "2-digit",
                                    }
                                  ),
                                },
                                ...previous,
                              ].slice(0, 5)
                          );
                        })
                        .catch(() => {
                          setError(
                            "Could not copy the email."
                          );
                        });
                    }}
                  >
                    Copy
                  </button>
                </div>

                <div
                  style={{
                    whiteSpace: "pre-wrap",
                    lineHeight: 1.75,
                    color: "#45424f",
                    background: "#ffffff",
                    border:
                      "1px solid #eeeaf5",
                    borderRadius: "12px",
                    padding: "18px",
                  }}
                >
                  {followupEmail}
                </div>
              </div>
            )}
          </div>
        </section>

        {/* ==========================================
            ORIGINAL NOTES
        ========================================== */}

        <section
          className="surface-card"
          style={{ marginTop: "20px" }}
        >
          <div className="card-title-row">
            <div className="feature-icon orange">
              ▤
            </div>

            <div>
              <h2>
                Original meeting notes
              </h2>

              <p>
                The source conversation preserved
                with the meeting record.
              </p>
            </div>
          </div>

          <div
            style={{
              background: "#faf9fd",
              borderRadius: "14px",
              padding: "20px",
              whiteSpace: "pre-wrap",
              lineHeight: 1.75,
              color: "#555261",
              border:
                "1px solid #eeeaf5",
            }}
          >
            {selectedMeeting.note ||
              "No original notes available."}
          </div>
        </section>
      </div>
    );
  };

  // ==========================================
  // ASK AI
  // ==========================================

  const renderAsk = () => (
    <section className="surface-card ai-workspace">
      <div className="ai-intro">
        <div className="ai-avatar">✳</div>

        <span className="eyebrow">
          MEETMIND ASSISTANT
        </span>

        <h2>
          What would you like to know?
        </h2>

        <p>
          Ask about a client's priorities,
          meeting history, deadlines, budgets,
          or outstanding commitments stored in
          your memory.
        </p>
      </div>

      <div className="suggestion-grid">
        {[
          "What does Client ABC care about?",
          "What commitments are still pending?",
          "Summarize the latest client context",
          "What should I follow up on?",
        ].map((suggestion) => (
          <button
            className="suggestion-card"
            key={suggestion}
            onClick={() =>
              setQuestion(suggestion)
            }
          >
            <span>✧</span> {suggestion}{" "}
            <b>↗</b>
          </button>
        ))}
      </div>

      <div className="chat-input-wrap">
        <textarea
          value={question}
          onChange={(e) =>
            setQuestion(e.target.value)
          }
          placeholder="Ask anything about your saved meeting knowledge..."
          rows={3}
          onKeyDown={(e) => {
            if (
              e.key === "Enter" &&
              !e.shiftKey
            ) {
              e.preventDefault();
              askAI();
            }
          }}
        />

        <div className="chat-input-footer">
          <span>
            Enter to ask · Shift + Enter for a
            new line
          </span>

          <ActionButton
            onClick={askAI}
            disabled={loading}
          >
            {loading
              ? "Thinking..."
              : "Ask MeetMind ↑"}
          </ActionButton>
        </div>
      </div>

      <p className="muted-note center">
        Answers depend on the memories available
        in your selected user's bank.
      </p>
    </section>
  );

  // ==========================================
  // BRIEF
  // ==========================================

  const renderBrief = () => (
    <div className="workspace-grid">
      <section className="surface-card">
        <div className="card-title-row">
          <div className="feature-icon blue">
            ▧
          </div>

          <div>
            <h2>Generate meeting brief</h2>

            <p>
              Prepare for a conversation with
              remembered context.
            </p>
          </div>
        </div>

        <div className="info-callout">
          <span>✳</span>

          <p>
            The backend builds this brief from
            information recalled from your
            persistent memory bank.
          </p>
        </div>

        <div className="button-row">
          <ActionButton
            onClick={() =>
              loadEndpoint(
                "/meeting-brief",
                "brief",
                "Meeting brief"
              )
            }
            disabled={loading}
          >
            ✧ Generate meeting brief
          </ActionButton>
        </div>
      </section>

      <section className="surface-card side-info">
        <span className="eyebrow">
          WHAT IT CAN SURFACE
        </span>

        <h2>Arrive with context.</h2>

        {[
          ["◈", "Relevant meeting history"],
          ["◎", "Client needs and priorities"],
          ["☑", "Open commitments"],
          ["↗", "Suggested next steps"],
        ].map(([icon, text]) => (
          <div
            className="simple-list-row"
            key={text}
          >
            <span>{icon}</span>
            {text}
          </div>
        ))}

        <p className="muted-note">
          The actual sections depend on what your
          backend and stored memories return.
        </p>
      </section>
    </div>
  );

  // ==========================================
  // CLIENT PROFILE
  // ==========================================

  const renderProfile = () => (
    <section className="surface-card">
      <div className="card-title-row">
        <div className="feature-icon purple">
          ♙
        </div>

        <div>
          <h2>Client profile</h2>

          <p>
            Generate a snapshot of client context
            from meeting memory.
          </p>
        </div>
      </div>

      <div className="info-callout">
        <span>ⓘ</span>

        <p>
          Your current backend route uses a
          predefined client reference
          ("Client ABC"). The field below is a
          demo label and does not change the
          backend's client lookup yet.
        </p>
      </div>

      <div className="form-field">
        <FieldLabel>
          Client label (display only)
        </FieldLabel>

        <input
          value={clientName}
          onChange={(e) =>
            setClientName(e.target.value)
          }
          placeholder="Client ABC"
        />
      </div>

      <ActionButton
        onClick={() =>
          loadEndpoint(
            "/client-profile",
            "profile",
            "Client profile"
          )
        }
        disabled={loading}
      >
        ✧ Generate client profile
      </ActionButton>
    </section>
  );

  // ==========================================
  // TASKS
  // ==========================================

  const renderTasks = () => (
    <section className="surface-card">
      <div className="card-title-row">
        <div className="feature-icon green">
          ☑
        </div>

        <div>
          <h2>
            Pending tasks and commitments
          </h2>

          <p>
            Ask the backend to extract outstanding
            actions from memory.
          </p>
        </div>
      </div>

      <div className="task-preview-grid">
        <div className="task-preview">
          <span className="task-preview-icon">
            ↗
          </span>

          <strong>Follow-ups</strong>

          <p>
            Messages and documents to send.
          </p>
        </div>

        <div className="task-preview">
          <span className="task-preview-icon">
            ◷
          </span>

          <strong>Deadlines</strong>

          <p>
            Dates and scheduled commitments.
          </p>
        </div>

        <div className="task-preview">
          <span className="task-preview-icon">
            ◎
          </span>

          <strong>Next actions</strong>

          <p>
            Actions mentioned in meetings.
          </p>
        </div>
      </div>

      <ActionButton
        onClick={() =>
          loadEndpoint(
            "/pending-tasks",
            "tasks",
            "Pending tasks"
          )
        }
        disabled={loading}
      >
        ☑ Load pending tasks
      </ActionButton>

      <p className="muted-note">
        Tasks are generated from backend memory;
        this page does not mark tasks complete or
        persist edits.
      </p>
    </section>
  );

  // ==========================================
  // INSIGHTS
  // ==========================================

  const renderInsights = () => (
    <section className="surface-card">
      <div className="card-title-row">
        <div className="feature-icon orange">
          ⌁
        </div>

        <div>
          <h2>
            Relationship intelligence
          </h2>

          <p>
            Generate a structured view of
            priorities and recommended actions.
          </p>
        </div>
      </div>

      <div className="insight-banner">
        <div className="insight-banner-icon">
          ✧
        </div>

        <div>
          <h3>
            Turn client context into next steps
          </h3>

          <p>
            Use saved commitments, client
            preferences, budgets, and dates to
            inform your next interaction.
          </p>
        </div>
      </div>

      <ActionButton
        onClick={() =>
          loadEndpoint(
            "/relationship-intelligence",
            "analysis",
            "Relationship intelligence"
          )
        }
        disabled={loading}
      >
        ✧ Generate relationship insights
      </ActionButton>
    </section>
  );

  // ==========================================
  // EMAIL
  // ==========================================

  const renderEmail = () => (
    <section className="surface-card">
      <div className="card-title-row">
        <div className="feature-icon blue">
          ✉
        </div>

        <div>
          <h2>
            Follow-up email generator
          </h2>

          <p>
            Create a professional email based on
            remembered meeting context.
          </p>
        </div>
      </div>

      <div className="email-preview">
        <div className="email-preview-top">
          <span className="email-preview-icon">
            ✉
          </span>

          <div>
            <strong>
              Meeting follow-up
            </strong>

            <span>
              AI-generated draft · Review before
              sending
            </span>
          </div>

          <span className="draft-badge">
            DRAFT
          </span>
        </div>

        <div className="email-preview-body">
          <span className="skeleton-line wide" />
          <span className="skeleton-line medium" />
          <span className="skeleton-line short" />

          <p>
            Your generated email will appear in
            the response below.
          </p>
        </div>
      </div>

      <ActionButton
        onClick={() =>
          loadEndpoint(
            "/followup-email",
            "email",
            "Follow-up email"
          )
        }
        disabled={loading}
      >
        ✧ Generate email draft
      </ActionButton>

      <p className="muted-note">
        This generates a draft only; it does not
        send an email.
      </p>
    </section>
  );

  // ==========================================
  // MEMORY
  // ==========================================

  const renderMemory = () => (
    <>
      <section className="surface-card">
        <div className="card-title-row">
          <div className="feature-icon purple">
            ◈
          </div>

          <div>
            <h2>Memory explorer</h2>

            <p>
              Inspect memory recall and retention
              operations.
            </p>
          </div>
        </div>

        <div className="diagnostic-grid">
          <button
            className="diagnostic-card"
            onClick={() =>
              runMemoryDiagnostic(
                "/all-memories",
                "All memories"
              )
            }
            disabled={loading}
          >
            <span className="diagnostic-icon purple">
              ◈
            </span>

            <strong>
              Recall memories
            </strong>

            <span>
              View the backend recall response.
            </span>

            <b>Run recall →</b>
          </button>

          <button
            className="diagnostic-card"
            onClick={() =>
              runMemoryDiagnostic(
                "/recall-test",
                "Recall test"
              )
            }
            disabled={loading}
          >
            <span className="diagnostic-icon blue">
              ⌕
            </span>

            <strong>Recall test</strong>

            <span>
              Test the configured recall route.
            </span>

            <b>Test recall →</b>
          </button>

          <button
            className="diagnostic-card"
            onClick={() =>
              runMemoryDiagnostic(
                "/hindsight-test",
                "Hindsight test"
              )
            }
            disabled={loading}
          >
            <span className="diagnostic-icon green">
              ✓
            </span>

            <strong>
              Hindsight test
            </strong>

            <span>
              Call the Hindsight diagnostic
              endpoint.
            </span>

            <b>Test Hindsight →</b>
          </button>

          <button
            className="diagnostic-card"
            onClick={() =>
              runMemoryDiagnostic(
                "/retain-test",
                "Retention test"
              )
            }
            disabled={loading}
          >
            <span className="diagnostic-icon orange">
              ↗
            </span>

            <strong>
              Retention test
            </strong>

            <span>
              Call the configured retention test
              route.
            </span>

            <b>Test retention →</b>
          </button>

          <button
            className="diagnostic-card"
            onClick={() =>
              runMemoryDiagnostic(
                "/commitment-test",
                "Commitment test"
              )
            }
            disabled={loading}
          >
            <span className="diagnostic-icon purple">
              ☑
            </span>

            <strong>
              Commitment test
            </strong>

            <span>
              Run the sample commitment retention
              operation.
            </span>

            <b>Test commitments →</b>
          </button>
        </div>

        <div className="info-callout warning-callout">
          <span>ⓘ</span>

          <p>
            Retention and commitment test routes
            may write sample data to your memory
            bank. Use them intentionally during
            your demo.
          </p>
        </div>
      </section>
    </>
  );

  // ==========================================
  // SYSTEM
  // ==========================================

  const renderSystem = () => (
    <>
      <section className="surface-card">
        <div className="card-title-row">
          <div className="feature-icon blue">
            ⌘
          </div>

          <div>
            <h2>System diagnostics</h2>

            <p>
              Call your backend routes and inspect
              the actual response.
            </p>
          </div>
        </div>

        <div className="diagnostic-grid">
          <button
            className="diagnostic-card"
            onClick={() =>
              request(
                "Backend connection test",
                async () => {
                  const response =
                    await getJSON(
                      `${API}/test`
                    );

                  return response;
                }
              )
            }
            disabled={loading}
          >
            <span className="diagnostic-icon green">
              ⌁
            </span>

            <strong>
              Backend test
            </strong>

            <span>
              Call GET /test.
            </span>

            <b>Run test →</b>
          </button>

          <button
            className="diagnostic-card"
            onClick={() =>
              runMemoryDiagnostic(
                "/hindsight-test",
                "Hindsight test"
              )
            }
            disabled={loading}
          >
            <span className="diagnostic-icon purple">
              ◈
            </span>

            <strong>Hindsight</strong>

            <span>
              Call GET /hindsight-test.
            </span>

            <b>Run test →</b>
          </button>

          <button
            className="diagnostic-card"
            onClick={() =>
              runMemoryDiagnostic(
                "/ask-test",
                "AI recall test"
              )
            }
            disabled={loading}
          >
            <span className="diagnostic-icon blue">
              ✳
            </span>

            <strong>
              AI recall test
            </strong>

            <span>
              Call GET /ask-test.
            </span>

            <b>Run test →</b>
          </button>

          <button
            className="diagnostic-card"
            onClick={() =>
              runMemoryDiagnostic(
                "/recall-test",
                "Memory recall test"
              )
            }
            disabled={loading}
          >
            <span className="diagnostic-icon orange">
              ⌕
            </span>

            <strong>
              Memory recall
            </strong>

            <span>
              Call GET /recall-test.
            </span>

            <b>Run test →</b>
          </button>

          <button
            className="diagnostic-card"
            onClick={() =>
              runMemoryDiagnostic(
                "/all-memories",
                "All memories"
              )
            }
            disabled={loading}
          >
            <span className="diagnostic-icon purple">
              ▤
            </span>

            <strong>
              All memories
            </strong>

            <span>
              Inspect the recall payload.
            </span>

            <b>Inspect →</b>
          </button>
        </div>

        <p className="muted-note">
          Diagnostic routes must exist in your
          current server.js. A failed route is
          shown as an error, not a simulated
          success.
        </p>
      </section>

      <section className="surface-card">
        <div className="section-heading compact">
          <div>
            <h2>Recent requests</h2>

            <p>
              Actions triggered during the current
              session.
            </p>
          </div>
        </div>

        {history.length ? (
          <div className="table-wrap">
            <table className="activity-table">
              <thead>
                <tr>
                  <th>Operation</th>
                  <th>Time</th>
                  <th>Status</th>
                </tr>
              </thead>

              <tbody>
                {history.map(
                  (item, index) => (
                    <tr
                      key={`${item.title}-${index}`}
                    >
                      <td>{item.title}</td>

                      <td>{item.time}</td>

                      <td>
                        <span className="soft-badge">
                          Response received
                        </span>
                      </td>
                    </tr>
                  )
                )}
              </tbody>
            </table>
          </div>
        ) : (
          <p className="muted-note">
            No requests made in this session
            yet.
          </p>
        )}
      </section>
    </>
  );

  // ==========================================
  // PAGE ROUTER
  // ==========================================

  const renderPage = () => {
    switch (page) {
      case "dashboard":
        return renderDashboard();

      case "meetings":
        return renderMeetings();

      case "ask":
        return renderAsk();

      case "brief":
        return renderBrief();

      case "profile":
        return renderProfile();

      case "tasks":
        return renderTasks();

      case "insights":
        return renderInsights();

      case "email":
        return renderEmail();

      case "memory":
        return renderMemory();

      case "system":
        return renderSystem();

      default:
        return renderDashboard();
    }
  };

  // ==========================================
  // MAIN APP
  // ==========================================

  return (
    <div className="app-shell">
      <aside className="sidebar">
        <button
          className="brand"
          onClick={() =>
            setPage("dashboard")
          }
          aria-label="Go to dashboard"
        >
          <span className="brand-mark">
            ✳
          </span>

          <span className="brand-text">
            <strong>MeetMind</strong>
            <small>
              MEETING INTELLIGENCE
            </small>
          </span>
        </button>

        <div className="workspace-switcher">
          <div className="workspace-avatar">
            M
          </div>

          <div className="workspace-meta">
            <strong>My workspace</strong>
            <span>
              Personal environment
            </span>
          </div>

          <span className="switcher-chevron">
            ⌄
          </span>
        </div>

        <nav className="sidebar-nav">
          {navigation.map((group) => (
            <div
              className="nav-group"
              key={group.title}
            >
              <div className="nav-heading">
                {group.title}
              </div>

              {group.items.map((item) => (
                <button
                  key={item.id}
                  className={`nav-item ${
                    page === item.id
                      ? "active"
                      : ""
                  }`}
                  onClick={() => {
                    setPage(item.id);
                    setError("");
                  }}
                >
                  <Icon>
                    {item.icon}
                  </Icon>

                  <span>{item.label}</span>

                  {item.id === "system" && (
                    <span className="nav-tag">
                      DEV
                    </span>
                  )}
                </button>
              ))}
            </div>
          ))}
        </nav>

        <div className="sidebar-bottom">
          <div className="memory-status">
            <div className="memory-status-icon">
              ◈
            </div>

            <div>
              <strong>
                Memory-powered AI
              </strong>

              <span>
                Hindsight + Groq
              </span>
            </div>

            <span className="status-indicator" />
          </div>

          <div className="sidebar-footer">
            <span className="footer-avatar">
              P
            </span>

            <div>
              <strong>
                Demo workspace
              </strong>

              <span>
                Local development
              </span>
            </div>
          </div>
        </div>
      </aside>

      <main className="main-area">
        <header className="topbar">
          <div className="breadcrumbs">
            <span>MeetMind</span>

            <span className="crumb-separator">
              /
            </span>

            <strong>
              {navigation
                .flatMap(
                  (group) => group.items
                )
                .find(
                  (item) =>
                    item.id === page
                )?.label ||
                "Dashboard"}
            </strong>
          </div>

          <div className="topbar-right">
            <div className="api-indicator">
              <span className="status-dot" />

              <span>Local API</span>
            </div>

            <div className="user-switcher">
              <label htmlFor="user-id">
                USER
              </label>

              <input
                id="user-id"
                value={userId}
                onChange={(e) =>
                  setUserId(
                    e.target.value
                  )
                }
                placeholder="User ID"
              />
            </div>

            <div className="top-avatar">
              {(
                userId.trim()[0] || "U"
              ).toUpperCase()}
            </div>
          </div>
        </header>

        <div className="page-container">
          <section className="page-heading">
            <div>
              <div className="eyebrow">
                {currentPage.eyebrow}
              </div>

              <h1>
                {currentPage.title}
              </h1>

              <p>
                {currentPage.description}
              </p>
            </div>

            {page !== "dashboard" && (
              <div className="page-heading-badge">
                <span className="status-dot" />
                MeetMind AI
              </div>
            )}
          </section>

          {error && (
            <div
              className="error-banner"
              role="alert"
            >
              <span className="error-icon">
                !
              </span>

              <div>
                <strong>
                  Request failed
                </strong>

                <p>{error}</p>
              </div>

              <button
                onClick={() =>
                  setError("")
                }
                aria-label="Dismiss error"
              >
                ×
              </button>
            </div>
          )}

          {renderPage()}

          <ResultPanel
            title={resultTitle}
            result={result}
            loading={loading}
            onClear={() => {
              setResult(null);
              setResultTitle("");
            }}
          />

          <footer className="app-footer">
            <span>✳ MeetMind</span>

            <span>
              AI meeting intelligence · Local demo
              environment
            </span>
          </footer>
        </div>
      </main>
    </div>
  );
}