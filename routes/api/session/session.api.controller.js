const keepAliveAPI = (req, res) => {
  if (req.session.user) {
    res.status(200).json({ success: true, message: "Session extended." });
  } else {
    res.status(401).json({ success: false, message: "No active session." });
  }
};

module.exports = { keepAliveAPI };
