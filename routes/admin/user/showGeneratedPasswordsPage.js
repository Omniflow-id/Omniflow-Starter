const showGeneratedPasswordsPage = (req, res) => {
  const generatedPasswords = req.session.generatedPasswords;

  if (!generatedPasswords || generatedPasswords.length === 0) {
    req.flash("error", "messages.noGeneratedPasswords");
    return res.redirect("/admin/user/index");
  }

  // Clear passwords from session after displaying (security)
  delete req.session.generatedPasswords;

  res.render("pages/admin/user/passwords", {
    generatedPasswords,
    title: res.locals.t("labels.generatedPasswordsTitle"),
  });
};

module.exports = { showGeneratedPasswordsPage };
