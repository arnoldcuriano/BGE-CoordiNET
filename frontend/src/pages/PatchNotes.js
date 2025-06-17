import React, { useState, useEffect } from "react";
import {
  Typography,
  Box,
  Divider,
  List,
  ListItem,
  ListItemText,
  CircularProgress,
  Grid,
  Toolbar,
  keyframes,
} from "@mui/material";
import { useTheme } from "../context/ThemeContext";
import axios from "axios";
import DOMPurify from "dompurify";
import parse from "html-react-parser";

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

const PatchNotes = () => {
  const { isDarkMode, muiTheme } = useTheme();
  const greenLightColor = "#34A853";
  const greenLightHoverBackground = "rgba(52, 168, 83, 0.1)";
  const hoverBackground = isDarkMode
    ? "rgba(255, 255, 255, 0.15)"
    : greenLightHoverBackground;

  const [patchNotes, setPatchNotes] = useState([]);
  const [selectedPatch, setSelectedPatch] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [lastUpdated, setLastUpdated] = useState(Date.now());

  const fetchPatchNotes = async () => {
    try {
      const response = await axios.get("/api/patch-notes");
      setPatchNotes(response.data);
      if (response.data && response.data.length > 0) {
        setSelectedPatch(response.data[0]);
      }
      setLoading(false);
    } catch (err) {
      console.error("Error fetching patch notes:", err);
      setError("Failed to load patch notes. Please try again later.");
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPatchNotes();
  }, []);

  useEffect(() => {
    const interval = setInterval(async () => {
      try {
        const response = await axios.get("/api/patch-notes");
        if (
          response.data.length !== patchNotes.length ||
          response.data.some(
            (note, index) => note._id !== patchNotes[index]?._id
          )
        ) {
          setPatchNotes(response.data);
          if (response.data && response.data.length > 0) {
            setSelectedPatch(response.data[0]);
          }
        }
      } catch (err) {
        console.error("Error polling patch notes:", err);
      }
    }, 30000); // Poll every 30 seconds

    return () => clearInterval(interval);
  }, [patchNotes, lastUpdated]);

  const handleSelectPatch = (patch) => {
    setSelectedPatch(patch);
  };

  if (loading) {
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

  if (error) {
    return (
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
          sx={{ position: "relative", zIndex: 1, p: 3, textAlign: "center" }}
        >
          <Toolbar /> {/* Add Toolbar to account for Navbar height */}
          <Typography variant="h5" color="error">
            Error
          </Typography>
          <Typography variant="body1" sx={{ mt: 2 }}>
            {error}
          </Typography>
        </Box>
      </Box>
    );
  }

  if (!patchNotes || patchNotes.length === 0) {
    return (
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
          sx={{ position: "relative", zIndex: 1, p: 3, textAlign: "center" }}
        >
          <Toolbar /> {/* Add Toolbar to account for Navbar height */}
          <Typography variant="h5">No Patch Notes Available</Typography>
          <Typography variant="body1" sx={{ mt: 2 }}>
            Check back later for updates.
          </Typography>
        </Box>
      </Box>
    );
  }

  return (
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
          maxWidth: "1200px",
          margin: "auto",
        }}
      >
        <Toolbar /> {/* Add Toolbar to account for Navbar height */}
        <Typography
          variant="h4"
          sx={{
            fontFamily: "'Poppins', sans-serif",
            color: muiTheme.palette.primary.main,
            fontWeight: "bold",
            textAlign: "center",
            mb: 4,
          }}
        >
          Patch Notes
        </Typography>
        <Grid container spacing={3}>
          {/* Sidebar Widget */}
          <Grid item xs={12} md={3}>
            <Box
              sx={{
                background: isDarkMode
                  ? "rgba(255, 255, 255, 0.05)"
                  : "rgba(255, 255, 255, 0.1)",
                backdropFilter: isDarkMode ? "blur(10px)" : "blur(15px)",
                borderRadius: "16px",
                border: isDarkMode
                  ? "1px solid rgba(255, 255, 255, 0.2)"
                  : "1px solid rgba(0, 0, 0, 0.1)",
                boxShadow: isDarkMode
                  ? "0 4px 12px rgba(0, 0, 0, 0.3)"
                  : "0 4px 12px rgba(0, 0, 0, 0.1)",
                padding: 2,
                maxHeight: "80vh",
                overflowY: "auto",
              }}
            >
              <Typography
                variant="h6"
                sx={{
                  fontFamily: "'Poppins', sans-serif",
                  color: muiTheme.palette.primary.main,
                  fontWeight: "bold",
                  mb: 2,
                }}
              >
                Patch History
              </Typography>
              <List sx={{ p: 0 }}>
                {patchNotes.map((patch, index) => (
                  <ListItem
                    key={index}
                    button
                    selected={selectedPatch && selectedPatch._id === patch._id}
                    onClick={() => handleSelectPatch(patch)}
                    sx={{
                      borderRadius: "8px",
                      mb: 1,
                      "&:hover": { backgroundColor: hoverBackground },
                      "&.Mui-selected": {
                        backgroundColor: isDarkMode
                          ? "rgba(255, 255, 255, 0.1)"
                          : "rgba(0, 0, 0, 0.05)",
                      },
                    }}
                  >
                    <ListItemText
                      primaryTypographyProps={{
                        fontFamily: "'Poppins', sans-serif",
                        color: muiTheme.palette.text.primary,
                        fontWeight: "bold",
                      }}
                      secondaryTypographyProps={{
                        fontFamily: "'Poppins', sans-serif",
                        color: muiTheme.palette.text.secondary,
                      }}
                      primary={patch.title}
                      secondary={
                        patch.publishedAt
                          ? new Date(patch.publishedAt).toLocaleDateString(
                              "en-US",
                              {
                                year: "numeric",
                                month: "short",
                                day: "numeric",
                              }
                            )
                          : "Unpublished"
                      }
                    />
                  </ListItem>
                ))}
              </List>
            </Box>
          </Grid>

          {/* Main Content */}
          <Grid item xs={12} md={9}>
            <Box
              sx={{
                background: isDarkMode
                  ? "rgba(255, 255, 255, 0.05)"
                  : "rgba(255, 255, 255, 0.1)",
                backdropFilter: isDarkMode ? "blur(10px)" : "blur(15px)",
                borderRadius: "16px",
                border: isDarkMode
                  ? "1px solid rgba(255, 255, 255, 0.2)"
                  : "1px solid rgba(0, 0, 0, 0.1)",
                boxShadow: isDarkMode
                  ? "0 4px 12px rgba(0, 0, 0, 0.3)"
                  : "0 4px 12px rgba(0, 0, 0, 0.1)",
                padding: { xs: "20px", sm: "30px" },
              }}
            >
              {selectedPatch ? (
                <>
                  <Typography
                    variant="h5"
                    sx={{
                      fontFamily: "'Poppins', sans-serif",
                      color: muiTheme.palette.primary.main,
                      fontWeight: "bold",
                      mb: 2,
                    }}
                  >
                    {selectedPatch.title}
                  </Typography>
                  <Typography
                    variant="body2"
                    sx={{
                      fontFamily: "'Poppins', sans-serif",
                      color: muiTheme.palette.text.secondary,
                      mb: 2,
                    }}
                  >
                    Published on{" "}
                    {new Date(selectedPatch.publishedAt).toLocaleDateString(
                      "en-US",
                      {
                        year: "numeric",
                        month: "long",
                        day: "numeric",
                      }
                    )}
                  </Typography>
                  <Divider
                    sx={{
                      width: "100%",
                      my: 2,
                      borderColor: muiTheme.palette.border.main,
                    }}
                  />
                  <Box
                    sx={{
                      fontFamily: "'Poppins', sans-serif",
                      color: muiTheme.palette.text.primary,
                      "& h3": { fontSize: "1.5rem", fontWeight: "bold", mb: 2 },
                      "& h4": {
                        fontSize: "1.25rem",
                        fontWeight: "bold",
                        mt: 2,
                        mb: 1,
                      },
                      "& p": { mb: 2 },
                      "& ul": { pl: 4, mb: 2 },
                      "& li": { mb: 1 },
                    }}
                  >
                    {parse(DOMPurify.sanitize(selectedPatch.content))}
                  </Box>
                </>
              ) : (
                <Typography
                  variant="body1"
                  sx={{
                    fontFamily: "'Poppins', sans-serif",
                    color: muiTheme.palette.text.primary,
                    textAlign: "center",
                  }}
                >
                  Select a patch note from the sidebar to view details.
                </Typography>
              )}
            </Box>
          </Grid>
        </Grid>
        <Typography
          variant="body2"
          sx={{
            fontFamily: "'Poppins', sans-serif",
            color: muiTheme.palette.text.secondary,
            textAlign: "center",
            mt: 4,
          }}
        >
          © 2025 BGE App. All rights reserved.
        </Typography>
      </Box>
    </Box>
  );
};

export default PatchNotes;
