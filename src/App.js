import "@/App.css";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { Toaster } from "sonner";
import BillScanner from "@/pages/BillScanner";

function App() {
    return (
        <div className="App">
            <BrowserRouter>
                <Routes>
                    <Route path="/" element={<BillScanner />} />
                </Routes>
            </BrowserRouter>
            <Toaster
                position="bottom-right"
                theme="light"
                toastOptions={{
                    style: {
                        borderRadius: "2px",
                        border: "1px solid #09090b",
                        background: "#ffffff",
                        color: "#09090b",
                        fontFamily: "IBM Plex Mono, monospace",
                    },
                }}
            />
        </div>
    );
}

export default App;
