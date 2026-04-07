import React from "react";
import { render, screen } from "@testing-library/react";
import App from "./App";

jest.mock("fourier-transform", () => () => new Float64Array(100));
global.ResizeObserver = class ResizeObserver {
  observe() {}
  unobserve() {}
  disconnect() {}
};

test("renders dashboard title", () => {
  render(<App />);
  const linkElement = screen.getByText(/Short-Time Fourier Transform/i);
  expect(linkElement).toBeInTheDocument();
});