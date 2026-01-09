import { useState } from "react";
import API from "../services/api";

export default function Register({ setIsLogin }) {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [name, setName] = useState("");

  const register = async () => {
    try {
      const res = await API.post("/auth/register", {
        name,
        email,
        password
      });

      alert("Registration successful! Please login.");
      setIsLogin(true);
    } catch (err) {
      console.error(err);
      alert(err.response?.data?.message || "Registration failed");
    }
  };

  return (
    <div className="w-96 p-6 shadow rounded">
      <h2 className="text-xl font-bold mb-4">Register</h2>

      <input
        className="input"
        placeholder="Name"
        onChange={e => setName(e.target.value)}
      />

      <input
        className="input mt-3"
        placeholder="Email"
        onChange={e => setEmail(e.target.value)}
      />

      <input
        className="input mt-3"
        type="password"
        placeholder="Password"
        onChange={e => setPassword(e.target.value)}
      />

      <button className="btn mt-4" onClick={register}>
        Register
      </button>

      <p
        className="mt-3 text-sm cursor-pointer text-blue-500"
        onClick={() => setIsLogin(true)}
      >
        Already have an account?
      </p>
    </div>
  );
}
