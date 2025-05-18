import React from 'react';

interface RegisterProps {
  onRegister: () => void;
  onSwitchToLogin: () => void;
}

const Register: React.FC<RegisterProps> = ({ onRegister, onSwitchToLogin }) => {
  return (
    <div className="p-4">
      <h2 className="text-lg font-bold mb-2">Registration Disabled</h2>
      <p className="mb-4">Please use Firebase authentication to register/login.</p>
      <button onClick={onSwitchToLogin} className="text-blue-600 underline">Back to Login</button>
    </div>
  );
};

export default Register; 