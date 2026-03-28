import supabase from "../config/supabase.js";

// ✅ OWASP A04: Insecure Design - Account Lockout After Failed Attempts
export const accountLockoutMiddleware = async (req, res, next) => {
  const { email } = req.body;

  if (!email) {
    return res.status(400).json({ error: "Email is required" });
  }

  try {
    // Get failed login attempts for this email
    const { data: failedLogin, error: fetchError } = await supabase
      .from("failed_logins")
      .select("*")
      .eq("email", email.toLowerCase())
      .single();

    if (fetchError && fetchError.code !== "PGRST116") {
      // PGRST116 = no rows found (first time)
      console.error("Database error:", fetchError);
      return res.status(500).json({ error: "Database error" });
    }

    // Check if account is locked
    if (failedLogin && failedLogin.locked_until) {
      const lockedUntil = new Date(failedLogin.locked_until);
      const now = new Date();

      if (now < lockedUntil) {
        const remainingTime = Math.ceil(
          (lockedUntil - now) / 1000 / 60
        ); // minutes
        return res.status(403).json({
          error: `🔒 Account is locked. Try again in ${remainingTime} minutes.`,
          lockedUntil: failedLogin.locked_until,
        });
      } else {
        // Lock time expired, reset attempts
        await supabase
          .from("failed_logins")
          .update({ attempts: 0, locked_until: null })
          .eq("email", email.toLowerCase());
      }
    }

    req.failedLoginData = failedLogin;
    next();
  } catch (error) {
    console.error("Account lockout error:", error);
    res.status(500).json({ error: "Internal server error" });
  }
};

// ✅ Record failed login attempt
export const recordFailedLogin = async (email) => {
  try {
    const emailLower = email.toLowerCase();

    // Get current attempts
    const { data: failedLogin } = await supabase
      .from("failed_logins")
      .select("*")
      .eq("email", emailLower)
      .single();

    let newAttempts = 1;
    if (failedLogin) {
      newAttempts = failedLogin.attempts + 1;
    }

    // Lock account after 5 failed attempts
    let lockedUntil = null;
    if (newAttempts >= 5) {
      lockedUntil = new Date(Date.now() + 15 * 60 * 1000); // Lock for 15 minutes
    }

    // Upsert failed login record
    await supabase.from("failed_logins").upsert(
      {
        email: emailLower,
        attempts: newAttempts,
        locked_until: lockedUntil,
        updated_at: new Date(),
      },
      { onConflict: "email" }
    );

    return { attempts: newAttempts, locked: newAttempts >= 5 };
  } catch (error) {
    console.error("Error recording failed login:", error);
    throw error;
  }
};

// ✅ Clear failed login attempts on successful login
export const clearFailedLogins = async (email) => {
  try {
    await supabase
      .from("failed_logins")
      .update({
        attempts: 0,
        locked_until: null,
        updated_at: new Date(),
      })
      .eq("email", email.toLowerCase());
  } catch (error) {
    console.error("Error clearing failed logins:", error);
  }
};
