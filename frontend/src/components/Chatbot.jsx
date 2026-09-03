import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import API from "../services/api";
import { connectSocket } from "../services/socket";
import BookingFlow from "./BookingFlow";
import TicketHistory from "./TicketHistory";

export default function Chatbot() {
  const [museum, setMuseum] = useState({});
  const [shows, setShows] = useState([]);
  const [view, setView] = useState("menu");

  const fetchData = async () => {
    try {
      const res = await API.get("/chatbot/info");
      const showRes = await API.get("/chatbot/shows");
      setMuseum(res.data);
      setShows(showRes.data);
    } catch (error) {
      console.error("Failed to fetch data:", error);
    }
  };

  useEffect(() => {
    fetchData();
    connectSocket(fetchData);
  }, []);

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
    <motion.div
      className="chatbox glass"
      variants={containerVariants}
      initial="hidden"
      animate="visible"
    >
      <motion.h2 variants={itemVariants}>🏛️ {museum.name || "Museum Booking"}</motion.h2>

      {view === "menu" && (
        <motion.div variants={containerVariants} initial="hidden" animate="visible">
          <motion.button
            variants={itemVariants}
            onClick={() => alert(`💰 Price: ₹${museum.ticketPrice || "N/A"}`)}
            whileHover={{ scale: 1.03 }}
            whileTap={{ scale: 0.98 }}
          >
            💰 View Prices
          </motion.button>

          <motion.button
            variants={itemVariants}
            onClick={() => alert("⏰ Museum Timings: 9 AM - 6 PM")}
            whileHover={{ scale: 1.03 }}
            whileTap={{ scale: 0.98 }}
          >
            ⏰ Museum Timings
          </motion.button>

          <motion.button
            variants={itemVariants}
            onClick={() => alert("📞 Contact: 9876543210")}
            whileHover={{ scale: 1.03 }}
            whileTap={{ scale: 0.98 }}
          >
            📞 Contact Us
          </motion.button>

          <motion.button
            variants={itemVariants}
            onClick={() => setView("booking")}
            whileHover={{ scale: 1.03 }}
            whileTap={{ scale: 0.98 }}
          >
            🎟️ Book Ticket
          </motion.button>

          <motion.button
            variants={itemVariants}
            onClick={() => setView("shows")}
            whileHover={{ scale: 1.03 }}
            whileTap={{ scale: 0.98 }}
          >
            🎭 View Shows
          </motion.button>

          <motion.button
            variants={itemVariants}
            onClick={() => setView("history")}
            whileHover={{ scale: 1.03 }}
            whileTap={{ scale: 0.98 }}
          >
            📜 Validate Ticket
          </motion.button>
        </motion.div>
      )}

      {view === "booking" && (
        <motion.div
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.3 }}
        >
          <BookingFlow museum={museum} back={() => setView("menu")} />
        </motion.div>
      )}

      {view === "shows" && (
        <motion.div
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.3 }}
        >
          <h3>🎭 Upcoming Shows</h3>

          {shows.length === 0 ? (
            <motion.p
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="text-center"
              style={{ marginTop: "20px", color: "rgba(255,255,255,0.8)" }}
            >
              ✨ No shows available at the moment
            </motion.p>
          ) : (
            <motion.div
              variants={containerVariants}
              initial="hidden"
              animate="visible"
            >
              {shows.map((s, idx) => (
                <motion.div
                  key={s.id}
                  className="show-item"
                  variants={itemVariants}
                  whileHover={{ x: 5 }}
                >
                  <h4>🎬 {s.name}</h4>
                  <p>📅 {new Date(s.date).toLocaleString()}</p>
                </motion.div>
              ))}
            </motion.div>
          )}

          <motion.button
            onClick={() => setView("menu")}
            whileHover={{ scale: 1.03 }}
            whileTap={{ scale: 0.98 }}
            style={{ marginTop: "20px" }}
          >
            ⬅️ Back to Menu
          </motion.button>
        </motion.div>
      )}

      {view === "history" && (
        <motion.div
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.3 }}
        >
          <TicketHistory back={() => setView("menu")} />
        </motion.div>
      )}
    </motion.div>
  );
}
