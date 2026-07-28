import { render, screen, fireEvent } from "@testing-library/react";
import { describe, it, expect, vi, beforeEach } from "vitest";
import { ConfirmDialog } from "@/components/confirm-dialog";

const defaultProps = {
  open: true,
  onOpenChange: vi.fn(),
  title: "Delete Record",
  description: "Are you sure you want to delete this record?",
  onConfirm: vi.fn(),
};

describe("ConfirmDialog", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("renders with title and description", () => {
    render(<ConfirmDialog {...defaultProps} />);
    expect(screen.getByText("Delete Record")).toBeInTheDocument();
    expect(screen.getByText("Are you sure you want to delete this record?")).toBeInTheDocument();
  });

  it("shows confirm and cancel buttons", () => {
    render(<ConfirmDialog {...defaultProps} />);
    expect(screen.getByText("Delete")).toBeInTheDocument();
    expect(screen.getByText("Cancel")).toBeInTheDocument();
  });

  it("shows custom confirm label", () => {
    render(<ConfirmDialog {...defaultProps} confirmLabel="Remove" />);
    expect(screen.getByText("Remove")).toBeInTheDocument();
  });

  it("calls onConfirm when confirm clicked", () => {
    render(<ConfirmDialog {...defaultProps} />);
    fireEvent.click(screen.getByText("Delete"));
    expect(defaultProps.onConfirm).toHaveBeenCalledTimes(1);
  });

  it("calls onOpenChange(false) when cancel clicked", () => {
    render(<ConfirmDialog {...defaultProps} />);
    fireEvent.click(screen.getByText("Cancel"));
    expect(defaultProps.onOpenChange).toHaveBeenCalledWith(false);
  });

  it("shows loading state when loading=true", () => {
    render(<ConfirmDialog {...defaultProps} loading={true} />);
    expect(screen.getByText("Deleting...")).toBeInTheDocument();
    expect(screen.getByText("Cancel")).toBeDisabled();
  });

  it("does not render when open=false", () => {
    render(<ConfirmDialog {...defaultProps} open={false} />);
    expect(screen.queryByText("Delete Record")).not.toBeInTheDocument();
  });
});
