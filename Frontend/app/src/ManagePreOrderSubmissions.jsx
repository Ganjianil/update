import React, { useEffect, useState } from "react";

export default function ManagePreOrderSubmissions() {
  const [submissions, setSubmissions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [errorMsg, setErrorMsg] = useState("");
  const [successMsg, setSuccessMsg] = useState("");

  useEffect(() => {
    fetchSubmissions();
  }, []);

  const fetchSubmissions = async () => {
    setLoading(true);
    setErrorMsg("");
    const token = localStorage.getItem("adminToken"); // Retrieve existing admin token

    try {
      const resp = await fetch(
        "https://update-xrp4.onrender.com/api/admin/preorder-submissions",
        {
          headers: {
            Authorization: `Bearer ${token}`, // Include token if available
          },
        }
      );
      if (!resp.ok) throw new Error("Failed to fetch preorders");
      setSubmissions(await resp.json());
    } catch (err) {
      setErrorMsg(
        "Failed to load submissions. Please ensure your session is valid."
      );
    }
    setLoading(false);
  };

  const handleDelete = async (id) => {
    if (!window.confirm("Delete this preorder submission?")) return;
    setErrorMsg("");
    setSuccessMsg("");
    const token = localStorage.getItem("adminToken");

    const resp = await fetch(
      `https://update-xrp4.onrender.com/api/admin/preorder-submissions/${id}`,
      {
        method: "DELETE",
        headers: {
          Authorization: `Bearer ${token}`, // Include token if available
        },
      }
    );
    if (resp.ok) {
      setSuccessMsg("Submission deleted.");
      fetchSubmissions();
    } else {
      setErrorMsg("Failed to delete submission.");
    }
  };

  return (
    <div className="max-w-4xl mx-auto py-10">
      <h2 className="text-2xl font-bold mb-5 text-indigo-700">
        Manage User Preorder Submissions
      </h2>

      {errorMsg && <div className="mb-3 text-red-600">{errorMsg}</div>}
      {successMsg && <div className="mb-3 text-green-600">{successMsg}</div>}

      {loading ? (
        <div>Loading...</div>
      ) : submissions.length === 0 ? (
        <div>No user preorder submissions yet.</div>
      ) : (
        <div className="border bg-white rounded shadow-md">
          <table className="min-w-full divide-y divide-gray-200">
            <thead>
              <tr className="bg-gray-100">
                <th className="px-4 py-2">Product</th>
                <th className="px-4 py-2">Option</th>
                <th className="px-4 py-2">User Info</th>
                <th className="px-4 py-2">Submitted</th>
                <th className="px-4 py-2" />
              </tr>
            </thead>
            <tbody>
              {submissions.map((sub) => (
                <tr key={sub.id} className="border-b">
                  <td className="px-4 py-2">
                    <div className="font-semibold">{sub.product_name}</div>
                    <div className="text-xs text-gray-500">
                      {sub.product_desc}
                    </div>
                  </td>
                  <td className="px-4 py-2 text-sm">
                    <div>
                      Material:{" "}
                      <span className="font-semibold">{sub.material_type}</span>
                    </div>
                    <div>Weight: {sub.weight}kg</div>
                    <div>Quantity: {sub.quantity}</div>
                    <div>Price: ₹{sub.price}</div>
                  </td>
                  <td className="px-4 py-2 text-xs">
                    {sub.client_name && (
                      <div className="font-semibold">{sub.client_name}</div>
                    )}
                    <div>{sub.contact_email}</div>
                    {sub.shipping_address && <div>{sub.shipping_address}</div>}
                    {sub.client_phone && <div>Phone: {sub.client_phone}</div>}
                    {sub.required_specifications && (
                      <div>Specifications: {sub.required_specifications}</div>
                    )}
                  </td>
                  <td className="px-4 py-2 text-xs text-gray-600">
                    {new Date(sub.created_at).toLocaleString()}
                  </td>
                  <td className="px-4 py-2">
                    <button
                      className="bg-red-600 text-white rounded px-3 py-1 text-xs hover:bg-red-700"
                      onClick={() => handleDelete(sub.id)}
                    >
                      Delete
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
