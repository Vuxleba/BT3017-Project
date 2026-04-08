import React from "react";
import { render, screen } from "@testing-library/react";
import App from "./App";

global.ResizeObserver = class ResizeObserver {
  observe() {}
  unobserve() {}
  disconnect() {}
};

test("renders dashboard title", () => {
  render(<App />);
  const linkElement = screen.getByText(/Discrete Fourier Transform Demonstration/i);
  expect(linkElement).toBeInTheDocument();
});