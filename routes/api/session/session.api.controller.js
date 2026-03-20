const keepAliveAPI = (req, res) => {
  if (req.session.user) {
    res.status(200).json({
      success: true,
      message: res.locals.t("common.session.extended"),
    });
  } else {
    res.status(401).json({
      success: false,
      message: res.locals.t("common.session.noActiveSession"),
    });
  }
};

module.exports = { keepAliveAPI };
