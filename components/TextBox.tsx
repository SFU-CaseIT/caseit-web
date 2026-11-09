import type { ComponentProps } from "react";

type TextBoxProps = Omit<ComponentProps<"input">, "id"> & {
  id: string;
  label: string;
  light?: boolean;
};

export function TextBox({ id, label, light = false, className, ...inputProps }: TextBoxProps) {
  return (
    <div>
      <label className="block text-sm font-semibold" htmlFor={id}>
        {label}
      </label>
      <input
        {...inputProps}
        className={`mt-2 min-h-11 w-full rounded-md border px-3 py-2 ${light ? "border-white bg-black/30 text-white focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-white" : "border-black text-black"} ${className ?? ""}`}
        id={id}
      />
    </div>
  );
}
