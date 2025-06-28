import { Loader2 } from "lucide-react";
import { FC, ComponentProps } from "react";

interface LoadingProps extends ComponentProps<"div"> {}

const Loading: FC<LoadingProps> = ({ className, ...props }) => {
  return (
    <div
      className={className ?? "flex min-h-screen items-center justify-center"}
      {...props}
    >
      <Loader2 className="h-16 w-16 animate-spin" />
    </div>
  );
};

export default Loading;
