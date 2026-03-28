import supabase from "../config/supabase.js";

// ✅ OWASP A09: Security Logging and Monitoring - Audit Log Middleware
export const auditLog = async (action, userId, details = {}, req = null) => {
  try {
    const ipAddress = req?.ip || 
                      req?.headers?.["x-forwarded-for"]?.split(",")[0]?.trim() || 
                      "unknown";

    const { error } = await supabase
      .from("audit_logs")
      .insert({
        action,
        user_id: userId || null,
        details: JSON.stringify(details),
        ip_address: ipAddress,
        created_at: new Date(),
      });

    if (error) {
      console.error("Audit log error:", error);
    }
  } catch (error) {
    console.error("Error writing to audit log:", error);
  }
};

// ✅ Middleware to automatically log requests
export const auditLogMiddleware = (action) => {
  return async (req, res, next) => {
    // Capture the original send function
    const originalSend = res.send;

    res.send = function (data) {
      // Log the action after response
      let details = {
        method: req.method,
        path: req.path,
        status: res.statusCode,
      };

      // Only log sensitive info on error responses
      if (res.statusCode >= 400) {
        details.error = data?.error || "Unknown error";
      }

      auditLog(action, req.user?.id || null, details, req);

      // Call the original send
      res.send = originalSend;
      return res.send(data);
    };

    next();
  };
};

// ✅ Log authentication events
export const logAuthEvent = (req, action, success, details = {}) => {
  auditLog(
    `AUTH_${action.toUpperCase()}_${success ? "SUCCESS" : "FAILED"}`,
    req.user?.id || null,
    {
      email: details.email || "unknown",
      reason: details.reason || "N/A",
      ipAddress: req.ip,
    },
    req
  );
};

// ✅ Log data access events
export const logDataAccess = (req, resource, action, success = true) => {
  auditLog(
    `DATA_ACCESS_${action.toUpperCase()}`,
    req.user?.id || null,
    {
      resource,
      success,
      timestamp: new Date(),
    },
    req
  );
};

// ✅ Log admin actions
export const logAdminAction = (req, action, targetId, changes = {}) => {
  auditLog(
    `ADMIN_${action.toUpperCase()}`,
    req.user?.id || null,
    {
      targetId,
      changes,
      timestamp: new Date(),
    },
    req
  );
};
