const showGeneratedPasswordsPage = (req, res) => {
  const generatedPasswords = req.session.generatedPasswords;

  if (!generatedPasswords || generatedPasswords.length === 0) {
    req.flash("error", "No generated passwords to display");
    return res.redirect("/admin/user/index");
  }

  // Clear passwords from session after displaying (security)
  delete req.session.generatedPasswords;

  res.render("pages/admin/user/passwords", {
    generatedPasswords,
    title: "Generated Passwords",
  });
};

module.exports = { showGeneratedPasswordsPage };
