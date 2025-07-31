const indexAPI = (req, res) => {
  res.status(200).json({
    message: "Success fetching the API",
    success: true,
    data: null,
  });
};

const protectedAPI = (req, res) => {
  res.status(200).json({
    message: "This is a protected API endpoint",
    success: true,
    data: null,
  });
};

module.exports = {
  indexAPI,
  protectedAPI,
};
