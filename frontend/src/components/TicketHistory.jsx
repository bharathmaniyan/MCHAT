import { useState } from "react";
import { motion } from "framer-motion";
import API from "../services/api";

export default function TicketHistory({ back }) {
  const [ticketId, setTicketId] = useState("");
  const [code, setCode] = useState("");
  const [result, setResult] = useState("");
  const [loading, setLoading] = useState(false);

  const validate = async () => {
    if (!ticketId || !code) {
      alert("Please enter both Ticket ID and Code");
      return;
    }

    setLoading(true);
    try {
      const res = await API.post(`/ticket/validate?ticketId=${ticketId}&code=${code}`);
      setResult(res.data);
      alert(res.data);
    } catch (error) {
      const errorMsg = error.response?.data || error.message;
      setResult(`Error: ${errorMsg}`);
      alert(`Error: ${errorMsg}`);
    } finally {
      setLoading(false);
    }
  };

  const containerVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: {
      opacity: 1,
      y: 0,
      transition: {
        duration: 0.5,
        staggerChildren: 0.1,
      },
    },
  };

  const itemVariants = {
    hidden: { opacity: 0, y: 10 },
    visible: { opacity: 1, y: 0, transition: { duration: 0.3 } },
  };

  return (
    <motion.div variants={containerVariants} initial="hidden" animate="visible">
      <motion.h3 variants={itemVariants} style={{ marginBottom: "20px" }}>
        📜 Validate Your Ticket
      </motion.h3>

      <motion.div className="form-group" variants={itemVariants}>
        <label>🎟️ Ticket ID</label>
        <motion.input
          type="text"
          placeholder="Enter your ticket ID"
          value={ticketId}
          onChange={(e) => setTicketId(e.target.value)}
          disabled={loading}
          whileFocus={{ scale: 1.02 }}
        />
      </motion.div>

      <motion.div className="form-group" variants={itemVariants}>
        <label>🔐 4-Digit Verification Code</label>
        <motion.input
          type="text"
          placeholder="Enter 4-digit code"
          value={code}
          onChange={(e) => setCode(e.target.value.toUpperCase())}
          maxLength="4"
          disabled={loading}
          whileFocus={{ scale: 1.02 }}
        />
      </motion.div>

      <motion.div
        style={{ display: "flex", gap: "12px" }}
        variants={itemVariants}
      >
        <motion.button
          onClick={validate}
          disabled={loading}
          whileHover={{ scale: 1.03 }}
          whileTap={{ scale: 0.98 }}
          style={{ flex: 1 }}
        >
          {loading ? "⏳ Validating..." : "✅ Validate Ticket"}
        </motion.button>

        {back && (
          <motion.button
            onClick={back}
            disabled={loading}
            whileHover={{ scale: 1.03 }}
            whileTap={{ scale: 0.98 }}
            style={{
              flex: 0.5,
              background: "rgba(255,255,255,0.1)",
            }}
          >
            ⬅️ Back
          </motion.button>
        )}
      </motion.div>

      {result && (
        <motion.div
          className="result-message"
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          style={{
            marginTop: "20px",
            padding: "16px",
            borderRadius: "12px",
          }}
        >
          <p>{result}</p>
        </motion.div>
      )}

      <motion.div
        className="card"
        variants={itemVariants}
        style={{
          marginTop: "20px",
          padding: "16px",
          border: "1px solid rgba(255,200,87,0.3)",
        }}
      >
        <strong style={{ color: "#ffc857" }}>⚠️ Important:</strong>
        <ul style={{ margin: "10px 0 0 20px", fontSize: "13px" }}>
          <li>Have your ticket ID and verification code ready</li>
          <li>Verification code is sent in your ticket email</li>
          <li>Enter exactly 4-digit code for validation</li>
        </ul>
      </motion.div>
    </motion.div>
  );
}
    </div>
  );
}
