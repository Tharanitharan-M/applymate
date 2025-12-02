"use client";

export default function TestUpload() {
  async function upload(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const form = new FormData();
    form.append("file", (e.target as HTMLFormElement).file?.files?.[0] as File);

    const res = await fetch("/api/resume/upload", {
      method: "POST",
      body: form
    });

    const json = await res.json();
    console.log("Server response:", json);
    alert("Check console for result");
  }

  return (
    <div style={{ padding: 20 }}>
      <h1>Test Resume Upload</h1>
      <form onSubmit={upload}>
        <input name="file" type="file" accept="application/pdf" />
        <button type="submit">Upload</button>
      </form>
    </div>
  );
}