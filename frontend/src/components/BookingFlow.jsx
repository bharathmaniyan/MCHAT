import { useState } from "react";
import { motion } from "framer-motion";
import API from "../services/api";

export default function BookingFlow({ museum, back }) {
  const [count, setCount] = useState(1);
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);

  const total = count * (museum.ticketPrice || 0);

  const isValidEmail = (email) => {
    const regex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return regex.test(email);
  };

  const payNow = async () => {
    setError("");

    if (!email || !isValidEmail(email)) {
      setError("❌ Please enter a valid email address");
      return;
    }

    if (count < 1) {
      setError("❌ Please select at least 1 ticket");
      return;
    }

    if (total <= 0) {
      setError("❌ Invalid amount. Please contact support");
      return;
    }

    setLoading(true);
    try {
      const orderResponse = await API.post(`/payments/create-order?amount=${total}`);
      const orderData = typeof orderResponse.data === "string" ? JSON.parse(orderResponse.data) : orderResponse.data;

      if (!orderData.id && !orderData.orderId) {
        throw new Error("Invalid order response from server");
      }

      const orderId = orderData.id || orderData.orderId;

      const options = {
        key: orderData.razorpayKey || "rzp_test_your_key_id",
        amount: orderData.amount || total * 100,
        currency: "INR",
        name: museum.name || "Museum Ticket Booking",
        description: `${count} Ticket(s) - Museum Entry`,
        order_id: orderId,

        handler: async function (response) {
          try {
            setLoading(true);
            const verificationResponse = await API.post(
              `/payments/verify-payment?orderId=${response.razorpay_order_id}&paymentId=${response.razorpay_payment_id}&signature=${response.razorpay_signature}`
            );

            if (verificationResponse.status === 200) {
              const bookingResponse = await API.post(`/booking/create?email=${email}&count=${count}`);

              setSuccess(true);
              setLoading(false);
              setError("");

              alert("✅ Payment Successful!\n\nYour booking is confirmed.\nCheck your email for the ticket with QR code.");

              setTimeout(() => {
                back();
              }, 2000);
            }
          } catch (verifyError) {
            setError("⚠️ Payment verification failed: " + (verifyError.response?.data?.message || verifyError.message));
            setLoading(false);
          }
        },

        prefill: {
          email: email,
          contact: "9876543210",
        },

        notes: {
          museum: museum.name,
          tickets: count,
          type: "booking",
        },

        theme: {
          color: "#7209b7",
        },

        modal: {
          ondismiss: function () {
            setError("❌ Payment cancelled. Please try again.");
            setLoading(false);
          },
        },

        timeout: 900,
      };

      const rzp = new window.Razorpay(options);

      rzp.on("payment.failed", function (response) {
        setError("❌ Payment Failed: " + (response.error?.description || "Please try a different payment method"));
        setLoading(false);
      });

      rzp.open();
    } catch (error) {
      const errorMsg = error.response?.data?.message || error.message || "Failed to initiate payment";
      setError("❌ " + errorMsg);
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
        🎟️ Book Your Ticket
      </motion.h3>

      {error && (
        <motion.div
          className="error-message"
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          exit={{ opacity: 0, x: -20 }}
        >
          {error}
        </motion.div>
      )}

      {success && (
        <motion.div
          className="success-message"
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
        >
          ✅ Booking confirmed! Redirecting...
        </motion.div>
      )}

      <motion.div
        className="card-gradient"
        variants={itemVariants}
        style={{
          marginBottom: "20px",
          padding: "16px",
          border: "1px solid rgba(255,255,255,0.2)",
        }}
      >
        <strong>🏛️ {museum.name || "Museum"}</strong>
      </motion.div>

      <motion.div className="form-group" variants={itemVariants}>
        <label>🎟️ Number of Tickets</label>
        <motion.input
          type="number"
          value={count}
          min="1"
          max="10"
          onChange={(e) => setCount(parseInt(e.target.value) || 1)}
          disabled={loading}
          whileFocus={{ scale: 1.02 }}
        />
      </motion.div>

      <motion.div
        className="card-gradient"
        variants={itemVariants}
        style={{ marginBottom: "20px", padding: "20px" }}
      >
        <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "10px" }}>
          <span>Price per Ticket</span>
          <strong>₹{museum.ticketPrice || 0}</strong>
        </div>
        <div style={{ display: "flex", justifyContent: "space-between", fontSize: "18px", fontWeight: "700" }}>
          <span>💰 Total Amount</span>
          <span style={{ color: "#b8a4ff" }}>₹{total}</span>
        </div>
      </motion.div>

      <motion.div className="form-group" variants={itemVariants}>
        <label>📧 Email Address</label>
        <motion.input
          type="email"
          placeholder="your.email@example.com"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          disabled={loading}
          whileFocus={{ scale: 1.02 }}
        />
        <small style={{ color: "rgba(255,255,255,0.7)", display: "block", marginTop: "6px" }}>
          Your ticket with QR code will be sent here
        </small>
      </motion.div>

      <motion.div
        style={{ display: "flex", gap: "12px", marginTop: "20px" }}
        variants={itemVariants}
      >
        <motion.button
          onClick={payNow}
          disabled={loading || !email || count < 1 || total <= 0}
          whileHover={{ scale: 1.03 }}
          whileTap={{ scale: 0.98 }}
          style={{ flex: 1 }}
        >
          {loading ? "⏳ Processing..." : `💳 Pay ₹${total} & Book`}
        </motion.button>

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
      </motion.div>

      <motion.div
        className="card"
        variants={itemVariants}
        style={{
          marginTop: "20px",
          padding: "16px",
          border: "1px solid rgba(76,175,80,0.3)",
        }}
      >
        <strong style={{ color: "#4caf50" }}>ℹ️ After Booking:</strong>
        <ul style={{ margin: "10px 0 0 20px", fontSize: "13px" }}>
          <li>Your PDF ticket with QR code will be emailed</li>
          <li>Show the QR code at entrance for verification</li>
          <li>Keep your confirmation email safe</li>
        </ul>
      </motion.div>
    </motion.div>
  );
}
            borderRadius: "8px",
            marginBottom: "16px",
            border: "1px solid #fecaca",
          }}
        >
          {error}
        </div>
      )}

      {/* Success Message */}
      {success && (
        <div
          style={{
            backgroundColor: "#dcfce7",
            color: "#166534",
            padding: "12px",
            borderRadius: "8px",
            marginBottom: "16px",
            border: "1px solid #86efac",
          }}
        >
          ✅ Booking confirmed! Redirecting...
        </div>
      )}

      {/* Museum Info */}
      <div
        style={{
          backgroundColor: "#f3f4f6",
          padding: "12px",
          borderRadius: "8px",
          marginBottom: "20px",
        }}
      >
        <strong>{museum.name}</strong>
      </div>

      {/* Ticket Count */}
      <div className="form-group" style={{ marginBottom: "16px" }}>
        <label style={{ fontWeight: "bold" }}>Number of Tickets:</label>
        <input
          type="number"
          value={count}
          min="1"
          max="10"
          onChange={(e) => setCount(parseInt(e.target.value) || 1)}
          disabled={loading}
          style={{
            width: "100%",
            padding: "8px",
            marginTop: "8px",
            border: "1px solid #d1d5db",
            borderRadius: "6px",
          }}
        />
      </div>

      {/* Price Info */}
      <div
        style={{
          backgroundColor: "#eff6ff",
          padding: "12px",
          borderRadius: "8px",
          marginBottom: "16px",
        }}
      >
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            marginBottom: "8px",
          }}
        >
          <span>Price per Ticket:</span>
          <span style={{ fontWeight: "bold" }}>₹{museum.ticketPrice || 0}</span>
        </div>
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            fontSize: "18px",
            fontWeight: "bold",
            color: "#6c63ff",
          }}
        >
          <span>Total Amount:</span>
          <span>₹{total}</span>
        </div>
      </div>

      {/* Email Input */}
      <div className="form-group" style={{ marginBottom: "16px" }}>
        <label style={{ fontWeight: "bold" }}>Email Address:</label>
        <input
          type="email"
          placeholder="your.email@example.com"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          disabled={loading}
          style={{
            width: "100%",
            padding: "8px",
            marginTop: "8px",
            border: "1px solid #d1d5db",
            borderRadius: "6px",
            boxSizing: "border-box",
          }}
        />
        <small style={{ color: "#6b7280", display: "block", marginTop: "4px" }}>
          Your ticket with QR code will be sent to this email
        </small>
      </div>

      {/* Action Buttons */}
      <div style={{ display: "flex", gap: "12px" }}>
        <button
          onClick={payNow}
          disabled={loading || !email || count < 1 || total <= 0}
          style={{
            flex: 1,
            padding: "10px",
            backgroundColor: loading ? "#9ca3af" : "#6c63ff",
            color: "white",
            border: "none",
            borderRadius: "6px",
            fontWeight: "bold",
            cursor: loading ? "not-allowed" : "pointer",
            fontSize: "16px",
          }}
        >
          {loading ? "Processing..." : `Pay ₹${total} & Book`}
        </button>

        <button
          onClick={back}
          disabled={loading}
          style={{
            padding: "10px 20px",
            backgroundColor: "#e5e7eb",
            color: "#1f2937",
            border: "none",
            borderRadius: "6px",
            fontWeight: "bold",
            cursor: loading ? "not-allowed" : "pointer",
          }}
        >
          Back
        </button>
      </div>

      {/* Info Box */}
      <div
        style={{
          marginTop: "20px",
          padding: "12px",
          backgroundColor: "#f0fdf4",
          borderLeft: "4px solid #10b981",
          borderRadius: "6px",
        }}
      >
        <strong style={{ color: "#065f46" }}>ℹ️ After Booking:</strong>
        <ul style={{ margin: "8px 0 0 20px", color: "#047857", fontSize: "14px" }}>
          <li>Your ticket PDF with QR code will be emailed</li>
          <li>Show the QR code at museum entry for verification</li>
          <li>Keep your confirmation email safe</li>
        </ul>
      </div>
    </div>
  );
}

