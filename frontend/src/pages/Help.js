import { useState, useEffect, useMemo } from "react";
import { Router, useNavigate } from "react-router-dom";
import { Box, Typography, keyframes } from "@mui/material";
import Layout from "../components/Layout";
import { useAuth } from "../context/AuthContext";
import { useTheme } from "../context/ThemeContext";
import { useTranslation } from "react-i18next";

const fadeIn = keyframes`
  from {
    opacity: 0;
    transform: translateY(20px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
`;

const Help = () => {
  const { isDarkMode, muiTheme } = useTheme();
  const { authState } = useAuth();
  const { t } = useTranslation();
  const navigate = useNavigate();

  const user = useMemo(() => {
    return authState.isAuthenticated
      ? {
          role: authState.userRole,
          firstName: authState.firstName,
          lastName: authState.lastName,
          profilePicture: authState.profilePicture,
        }
      : null;
  }, [authState]);

  useEffect(() => {
    if (!authState.isAuthenticated) {
      navigate("/login");
    }
  }, [authState.isAuthenticated, navigate]);

  return (
    <Layout user={user}>
      <Box
        sx={{
          minHeight: "100vh",
          background: muiTheme.custom.gradients.backgroundDefault,
          p: { xs: 2, sm: 3, md: 4 },
          position: "relative",
          overflow: "hidden",
          animation: `${fadeIn} 0.8s ease-out`,
        }}
      >
        <Box
          sx={{
            position: "absolute",
            top: 0,
            left: 0,
            width: "100%",
            height: "100%",
            background: isDarkMode
              ? "radial-gradient(circle at 30% 30%, rgba(66, 133, 244, 0.2) 0%, transparent 70%)"
              : "radial-gradient(circle at 30% 30%, rgba(52, 168, 83, 0.2) 0%, transparent 70%)",
            zIndex: 0,
          }}
        />
        <Box
          sx={{
            position: "relative",
            zIndex: 1,
            maxWidth: "800px",
            mx: "auto",
            textAlign: "center",
          }}
        >
          <Typography variant="h4" sx={{ mb: 2 }}>
            {t("help.title")}
          </Typography>
          <Typography variant="body1" sx={{ mb: 3 }}>
            {t("help.description")}
          </Typography>
        </Box>
      </Box>
    </Layout>
  );
};

export default Help;
