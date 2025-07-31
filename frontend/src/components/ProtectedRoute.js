import React, { useEffect } from "react";
import { Navigate, useLocation } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { CircularProgress, Box } from "@mui/material";

const ProtectedRoute = ({ children, isPublic = false, pageKey }) => {
  const { authState, fetchUser } = useAuth();
  const location = useLocation();

  console.log("ProtectedRoute: Current authState:", authState);
  console.log("ProtectedRoute: pageKey:", pageKey);
  console.log("ProtectedRoute: location:", location.pathname);

  useEffect(() => {
    if (!authState.isAuthenticated && !isPublic && !authState.loading) {
      console.log(
        "ProtectedRoute: Triggering fetchUser due to unauthenticated state"
      );
      fetchUser();
    }
  }, [authState.isAuthenticated, authState.loading, isPublic, fetchUser]);

  if (authState.loading) {
    console.log(
      "ProtectedRoute: authState is loading, showing loading indicator"
    );
    return (
      <Box
        sx={{
          display: "flex",
          justifyContent: "center",
          alignItems: "center",
          height: "100vh",
        }}
      >
        <CircularProgress />
      </Box>
    );
  }

  if (isPublic) {
    console.log("ProtectedRoute: Route is public");
    if (authState.isAuthenticated) {
      console.log(
        "ProtectedRoute: User authenticated, checking approval status"
      );
      if (!authState.isApproved) {
        console.log(
          "ProtectedRoute: User not approved, redirecting to /welcome"
        );
        return (
          <Navigate
            to="/welcome"
            state={{
              message: "Your account is awaiting approval.",
              from: location,
            }}
            replace
          />
        );
      }

      const corePageKeys = [
        "dashboard",
        "member",
        "partners",
        "hrManagement",
        "projects",
        "itInventory",
        "quickTools",
        "superadminDashboard",
        "analytics",
        "financeManagement",
      ];

      const hasCoreAccess = corePageKeys.some(
        (key) => authState.accessPermissions?.[key] === true
      );
      console.log("ProtectedRoute: hasCoreAccess:", hasCoreAccess);

      if (hasCoreAccess || authState.userRole === "superadmin") {
        const redirectRoutes = [
          { key: "dashboard", path: "/dashboard" },
          { key: "hrManagement", path: "/hr-management" },
          { key: "partners", path: "/partners" },
          { key: "projects", path: "/projects" },
          { key: "itInventory", path: "/it-inventory" },
          { key: "quickTools", path: "/quick-tools" },
          { key: "superadminDashboard", path: "/superadmin-dashboard" },
          { key: "analytics", path: "/analytics" },
          { key: "financeManagement", path: "/finance-management" },
        ];

        const accessibleRoute =
          authState.userRole === "superadmin"
            ? { path: "/dashboard" }
            : redirectRoutes.find(
                (route) => authState.accessPermissions?.[route.key] === true
              );
        const redirectPath = accessibleRoute
          ? accessibleRoute.path
          : "/welcome";
        const redirectState = accessibleRoute
          ? { from: location }
          : {
              message:
                "Welcome! Please wait for the Super Admin to assign your permissions.",
              from: location,
            };
        console.log("ProtectedRoute: Redirecting to:", redirectPath);
        return <Navigate to={redirectPath} state={redirectState} replace />;
      }
    }
    console.log("ProtectedRoute: Allowing access to public route");
    return children;
  }

  if (!authState.isAuthenticated) {
    console.log(
      "ProtectedRoute: User not authenticated, redirecting to /login"
    );
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  if (!authState.isApproved) {
    console.log("ProtectedRoute: User not approved, redirecting to /welcome");
    return (
      <Navigate
        to="/welcome"
        state={{
          message: "Your account is awaiting approval.",
          from: location,
        }}
        replace
      />
    );
  }

  if (authState.userRole === "superadmin") {
    console.log(
      "ProtectedRoute: Superadmin detected, granting unrestricted access to",
      location.pathname
    );
    return children;
  }

  const publicPageKeys = ["settings", "help", "patchNotes"];
  if (pageKey && publicPageKeys.includes(pageKey)) {
    console.log("ProtectedRoute: Allowing access to public route:", pageKey);
    return children;
  }

  if (pageKey) {
    const hasAccess = authState.accessPermissions?.[pageKey] === true;
    console.log(
      "ProtectedRoute: Checking access for pageKey:",
      pageKey,
      "hasAccess:",
      hasAccess
    );
    if (!hasAccess) {
      console.log(
        "ProtectedRoute: Access denied to",
        pageKey,
        "redirecting to /welcome"
      );
      return (
        <Navigate
          to="/welcome"
          state={{
            message:
              "You do not have access to this page. Please contact an administrator.",
            from: location,
          }}
          replace
        />
      );
    }
  }

  console.log(
    "ProtectedRoute: User has permission, allowing access to",
    location.pathname
  );
  return children;
};

export default ProtectedRoute;
