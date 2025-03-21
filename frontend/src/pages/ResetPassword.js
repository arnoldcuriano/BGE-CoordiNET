import React, { useState } from 'react';
import { TextField, Button, Typography, Container } from '@mui/material';

const ResetPassword = () => {
  const [password, setPassword] = useState('');

  const handleSubmit = (e) => {
    e.preventDefault();
    console.log('Reset Password:', { password });
  };

  return (
    <Container>
      <Typography variant="h4" gutterBottom>Reset Password</Typography>
      <form onSubmit={handleSubmit}>
        <TextField
          label="New Password"
          type="password"
          fullWidth
          margin="normal"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          required
        />
        <Button type="submit" variant="contained" color="primary">
          Reset Password
        </Button>
      </form>
    </Container>
  );
};

export default ResetPassword;