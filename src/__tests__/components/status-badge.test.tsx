import { render, screen } from "@testing-library/react";
import { describe, it, expect } from "vitest";
import { StatusBadge } from "@/components/status-badge";

describe("StatusBadge", () => {
  it("renders APPROVED status", () => {
    render(<StatusBadge status="APPROVED" />);
    expect(screen.getByText("APPROVED")).toBeInTheDocument();
  });

  it("renders PENDING status", () => {
    render(<StatusBadge status="PENDING" />);
    expect(screen.getByText("PENDING")).toBeInTheDocument();
  });

  it("renders REJECTED status", () => {
    render(<StatusBadge status="REJECTED" />);
    expect(screen.getByText("REJECTED")).toBeInTheDocument();
  });

  it("renders ACTIVE status", () => {
    render(<StatusBadge status="ACTIVE" />);
    expect(screen.getByText("ACTIVE")).toBeInTheDocument();
  });

  it("renders EXPIRED status", () => {
    render(<StatusBadge status="EXPIRED" />);
    expect(screen.getByText("EXPIRED")).toBeInTheDocument();
  });

  it("renders RELEASED status", () => {
    render(<StatusBadge status="RELEASED" />);
    expect(screen.getByText("RELEASED")).toBeInTheDocument();
  });

  it("renders DENIED status", () => {
    render(<StatusBadge status="DENIED" />);
    expect(screen.getByText("DENIED")).toBeInTheDocument();
  });

  it("renders unknown status with fallback styling", () => {
    render(<StatusBadge status="CUSTOM_STATUS" />);
    expect(screen.getByText("CUSTOM_STATUS")).toBeInTheDocument();
  });
});
