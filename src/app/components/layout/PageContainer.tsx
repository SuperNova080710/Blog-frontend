import { ReactNode } from "react"

type PageContainerProps = {
    children: ReactNode;
};

export default function PageContainer({ children }: PageContainerProps) {
    return (
        <div className="mx-auto w-full max-w-6xl px-4 py-8 sm:px-6 xm:py-10">
            {children}
        </div>
    );
}