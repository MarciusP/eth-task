import "./CustomAppBarButton.scss";

interface CustomAppBarButtonProps {
  disabled: boolean;
  onClick: () => void;
  selected: boolean;
  text: string;
}

function CustomAppBarButton({
  disabled,
  onClick,
  selected,
  text,
}: CustomAppBarButtonProps) {
  return (
    <button
      className={`custom-app-bar-button${disabled ? " disabled" : ""}${
        selected ? " selected" : ""
      }`}
      onClick={onClick}
    >
      {text}
    </button>
  );
}

export default CustomAppBarButton;
