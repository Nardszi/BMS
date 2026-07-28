import { render, screen } from "@testing-library/react";
import { describe, it, expect } from "vitest";
import { EmptyState } from "@/components/empty-state";
import { Inbox } from "lucide-react";

describe("EmptyState", () => {
  it("renders with title", () => {
    render(<EmptyState icon={Inbox} title="No items found" />);
    expect(screen.getByText("No items found")).toBeInTheDocument();
  });

  it("renders with optional description", () => {
    render(
      <EmptyState
        icon={Inbox}
        title="No items found"
        description="Create a new item to get started"
      />
    );
    expect(screen.getByText("No items found")).toBeInTheDocument();
    expect(screen.getByText("Create a new item to get started")).toBeInTheDocument();
  });

  it("renders action button when provided", () => {
    render(
      <EmptyState
        icon={Inbox}
        title="No items found"
        action={<button>Create Item</button>}
      />
    );
    expect(screen.getByText("Create Item")).toBeInTheDocument();
  });

  it("renders without action when not provided", () => {
    const { container } = render(
      <EmptyState icon={Inbox} title="No items found" />
    );
    const actionArea = container.querySelector(".mt-4");
    expect(actionArea).not.toBeInTheDocument();
  });
});
