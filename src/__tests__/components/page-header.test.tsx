import { render, screen } from "@testing-library/react";
import { describe, it, expect } from "vitest";
import { PageHeader } from "@/components/page-header";

describe("PageHeader", () => {
  it("renders title", () => {
    render(<PageHeader title="Dashboard" />);
    expect(screen.getByText("Dashboard")).toBeInTheDocument();
  });

  it("renders subtitle", () => {
    render(
      <PageHeader title="Dashboard" subtitle="Overview of your system" />
    );
    expect(screen.getByText("Dashboard")).toBeInTheDocument();
    expect(screen.getByText("Overview of your system")).toBeInTheDocument();
  });

  it("renders children", () => {
    render(
      <PageHeader title="Dashboard">
        <button>Add New</button>
      </PageHeader>
    );
    expect(screen.getByText("Dashboard")).toBeInTheDocument();
    expect(screen.getByText("Add New")).toBeInTheDocument();
  });

  it("renders without subtitle", () => {
    render(<PageHeader title="Dashboard" />);
    const heading = screen.getByText("Dashboard");
    expect(heading.tagName).toBe("H2");
  });
});
