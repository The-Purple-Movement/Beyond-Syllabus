import { ScaleLoader } from "react-spinners";

export default function Loader() {
    return (
        <div className="flex items-center justify-center w-screen h-screen">
            <ScaleLoader color="#D900FF" />
        </div>
    );
}
