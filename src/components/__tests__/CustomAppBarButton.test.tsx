import { render, screen } from "@testing-library/react";
import "@testing-library/jest-dom";
import CustomAppBarButton from "../ui/CustomAppBarButton";

it("renders CustomAppBarButton with correct text", () => {
  const buttonText = "Test Button";
  const handleClick = jest.fn();
  render(
    <CustomAppBarButton
      text={buttonText}
      selected={false}
      disabled={false}
      onClick={handleClick}
    />
  );

  const buttonElement = screen.getByRole("button", { name: buttonText });
  expect(buttonElement).toBeInTheDocument();
  expect(buttonElement).toHaveTextContent(buttonText);
  expect(buttonElement).not.toHaveClass("selected");
  expect(buttonElement).not.toHaveClass("disabled");
});

it("renders CustomAppBarButton with selected styles when selected is true", () => {
  const buttonText = "Selected Button";
  const handleClick = jest.fn();
  render(
    <CustomAppBarButton
      text={buttonText}
      selected={true}
      disabled={false}
      onClick={handleClick}
    />
  );

  const buttonElement = screen.getByRole("button", { name: buttonText });
  expect(buttonElement).toBeInTheDocument();
  expect(buttonElement).toHaveClass("selected");
  expect(buttonElement).not.toHaveClass("disabled");
});

it("renders CustomAppBarButton with disabled styles when disabled is true", () => {
  const buttonText = "Disabled Button";
  const handleClick = jest.fn();
  render(
    <CustomAppBarButton
      text={buttonText}
      selected={false}
      disabled={true}
      onClick={handleClick}
    />
  );

  const buttonElement = screen.getByRole("button", { name: buttonText });
  expect(buttonElement).toBeInTheDocument();
  expect(buttonElement).toHaveClass("disabled");
  expect(buttonElement).not.toHaveClass("selected");
  expect(buttonElement).toBeDisabled();
});
