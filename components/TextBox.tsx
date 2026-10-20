import type { ComponentProps } from "react";

type TextBoxProps = Omit<ComponentProps<"input">, "id"> & {
  id: string;
  label: string;
};

export function TextBox({ id, label, className, ...inputProps }: TextBoxProps) {
  return (
    <div>
      <label className="block text-sm font-semibold" htmlFor={id}>
        {label}
      </label>
      <input
        {...inputProps}
        className={`mt-2 min-h-11 w-full rounded-md border border-black px-3 py-2 text-black ${className ?? ""}`}
        id={id}
      />
    </div>
  );
}
