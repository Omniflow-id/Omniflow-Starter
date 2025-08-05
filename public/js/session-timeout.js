window.addEventListener("DOMContentLoaded", (event) => {
  // Session Timeout Logic
  // const sessionTimeout = 24 * 60 * 60 * 1000; // 24 hours - Should match server session.cookie.maxAge
  // const warningTime = 2 * 60 * 1000; // 2 minutes before timeout

  const sessionTimeout = 1 * 60 * 1000; // 1 minute for testing
  const warningTime = 30 * 1000; // 30 seconds warning

  let sessionTimeoutTimer;
  let warningTimer;

  const startTimers = () => {
    // Clear existing timers
    clearTimeout(sessionTimeoutTimer);
    clearTimeout(warningTimer);

    // Timer to force logout
    sessionTimeoutTimer = setTimeout(() => {
      submitLogoutForm();
    }, sessionTimeout);

    // Timer to show warning modal
    warningTimer = setTimeout(() => {
      const sessionModal = new bootstrap.Modal(
        document.getElementById("sessionTimeoutModal")
      );
      sessionModal.show();

      let countdown = warningTime / 1000;
      const countdownElement = document.getElementById(
        "sessionTimeoutCountdown"
      );
      countdownElement.textContent = countdown;

      const interval = setInterval(() => {
        countdown--;
        if (countdownElement) {
          countdownElement.textContent = countdown;
        }
        if (countdown <= 0) {
          clearInterval(interval);
          submitLogoutForm(); // Submit logout form if modal is ignored
        }
      }, 1000);
    }, sessionTimeout - warningTime);
  };

  const resetTimers = () => {
    startTimers();
  };

  const submitLogoutForm = () => {
    try {
      const csrfTokenElement = document.querySelector('meta[name="csrf-token"]');
      const csrfToken = csrfTokenElement?.getAttribute("content");
      
      // If no CSRF token, use GET logout
      if (!csrfTokenElement || !csrfToken) {
        console.warn("CSRF token not available, using GET logout");
        window.location.href = "/admin/logout";
        return;
      }

      // Try POST logout with CSRF token
      const form = document.createElement("form");
      form.method = "POST";
      form.action = "/admin/logout";

      const csrfInput = document.createElement("input");
      csrfInput.type = "hidden";
      csrfInput.name = "_csrf";
      csrfInput.value = csrfToken;

      form.appendChild(csrfInput);
      document.body.appendChild(form);
      
      // Set up fallback timeout
      const fallbackTimer = setTimeout(() => {
        if (!document.hidden) {
          console.warn("POST logout taking too long, falling back to GET logout");
          window.location.href = "/admin/logout";
        }
      }, 2000); // 2 second timeout

      // Handle form submission errors
      form.addEventListener('error', function(e) {
        clearTimeout(fallbackTimer);
        console.warn("POST logout failed, falling back to GET logout");
        window.location.href = "/admin/logout";
      });

      // Clear fallback timer if page unloads (successful logout)
      window.addEventListener('beforeunload', function() {
        clearTimeout(fallbackTimer);
      });

      form.submit();
    } catch (error) {
      console.error("Error during logout form submission:", error);
      // Fallback: GET logout
      window.location.href = "/admin/logout";
    }
  };

  const extendSession = () => {
    // Remove focus from the active element (button) to prevent accessibility issues
    if (document.activeElement) {
      document.activeElement.blur();
    }

    const csrfToken = document
      .querySelector('meta[name="csrf-token"]')
      ?.getAttribute("content");

    fetch("/api/session/keep-alive", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-csrf-token": csrfToken,
      },
    })
      .then((res) => {
        if (res.ok) {
          return res.json();
        }
        throw new Error("Network response was not ok.");
      })
      .then((data) => {
        if (data.success) {
          const modalInstance = bootstrap.Modal.getInstance(
            document.getElementById("sessionTimeoutModal")
          );
          if (modalInstance) {
            modalInstance.hide();
          }
          resetTimers();
        } else {
          submitLogoutForm();
        }
      })
      .catch((error) => {
        console.error("Failed to extend session:", error);
      });
  };

  // Initial start
  if (document.getElementById("sessionTimeoutModal")) {
    startTimers();

    // Reset timers on user activity
    document.addEventListener("click", resetTimers);
    document.addEventListener("keypress", resetTimers);
    document.addEventListener("scroll", resetTimers);
    document.addEventListener("mousemove", resetTimers);

    // Attach event listener to the "Extend Session" button
    const extendBtn = document.getElementById("extendSessionBtn");
    if (extendBtn) {
      extendBtn.addEventListener("click", extendSession);
    }

    const logoutBtn = document.getElementById("logoutSessionBtn");
    if (logoutBtn) {
      logoutBtn.addEventListener("click", () => {
        submitLogoutForm();
      });
    }
  }
});
