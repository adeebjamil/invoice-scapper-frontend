import axios from "axios";

const BACKEND_URL = (process.env.REACT_APP_BACKEND_URL || "http://localhost:8000").replace(/\/$/, "");
export const API = `${BACKEND_URL}/api`;

export async function extractBill(file) {
    const form = new FormData();
    form.append("file", file);
    const res = await axios.post(`${API}/extract`, form, {
        headers: { "Content-Type": "multipart/form-data" },
        timeout: 180000,
    });
    return res.data;
}

export async function downloadExcel({ columns, rows, filename }) {
    const res = await axios.post(
        `${API}/download-excel`,
        { columns, rows, filename: filename || "bill_data.xlsx" },
        { responseType: "blob" },
    );
    const blob = new Blob([res.data], {
        type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
    });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = filename || "bill_data.xlsx";
    document.body.appendChild(a);
    a.click();
    a.remove();
    window.URL.revokeObjectURL(url);
}

export async function getHistory() {
    const res = await axios.get(`${API}/history`);
    return res.data;
}

export async function deleteHistoryItem(id) {
    const res = await axios.delete(`${API}/history/${id}`);
    return res.data;
}

export async function deleteHistoryBulk(ids) {
    const res = await axios.delete(`${API}/history`, { data: { ids } });
    return res.data;
}

export async function clearAllHistory() {
    const res = await axios.delete(`${API}/history`);
    return res.data;
}
