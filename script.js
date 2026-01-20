import { db } from "./firebase.js";
import { collection, addDoc } from "https://www.gstatic.com/firebasejs/12.8.0/firebase-firestore.js";


function showToast(message, type = "success") {
  const toast = document.getElementById("toast");
  toast.textContent = message;
  toast.className = `toast show ${type}`;

  setTimeout(() => {
    toast.className = "toast";
  }, 3000);
}



document.addEventListener("DOMContentLoaded", () => {
  console.log("DOM loaded");

  const form = document.getElementById("libraryForm");
  const photoInput = document.getElementById("photo");
  const fileName = document.getElementById("fileName");
  const previewImage = document.getElementById("previewImage");
  const placeholder = document.getElementById("photoPlaceholder");

  if (!form) {
    console.error("Form not found");
    return;
  }

  /* ================= PHOTO PREVIEW ================= */

  photoInput.addEventListener("change", (e) => {
    const file = e.target.files[0];

    if (!file) {
      fileName.textContent = "No file chosen";
      previewImage.style.display = "none";
      placeholder.style.display = "flex";
      return;
    }

    if (file.size > 512000) {
      alert("File size must be less than 500KB");
      photoInput.value = "";
      fileName.textContent = "No file chosen";
      return;
    }

    fileName.textContent = file.name;

    const reader = new FileReader();
    reader.onload = () => {
      previewImage.src = reader.result;
      previewImage.style.display = "block";
      placeholder.style.display = "none";
    };
    reader.readAsDataURL(file);
  });

  /* ================= FORM SUBMIT ================= */

  form.addEventListener("submit", (e) => {
    e.preventDefault();
    console.log("Submit clicked");

    // Declaration check
    const declaration = document.getElementById("declaration");
    if (!declaration.checked) {
      showToast("Please accept the declaration", "error");
      return;
    }

    const file = photoInput.files[0];
    if (!file) {
      showToast("Please upload photo", "error");
      return;
    }

    const reader = new FileReader();
    reader.onload = async () => {
      const photoBase64 = reader.result;

      const data = {
        name: document.getElementById("name").value,
        rollNo: document.getElementById("rollNo").value,
        email: document.getElementById("email").value,
        phone: document.getElementById("phone").value,
        dob: document.getElementById("dob").value,
        bloodGroup: document.getElementById("bloodGroup").value,
        fatherName: document.getElementById("fatherName").value,
        parentMobile: document.getElementById("parentMobile").value,
        programme: document.getElementById("programme").value,
        branch: document.getElementById("branch").value,
        batch: document.getElementById("batch").value,
        address1: document.getElementById("addressLine1").value,
        address2: document.getElementById("addressLine2").value || "",
        district: document.getElementById("district").value,
        state: document.getElementById("state").value,
        pinCode: document.getElementById("pinCode").value,
        photoBase64: photoBase64,
        submittedAt: new Date()
      };

      try {
        console.log("Saving to Firestore...");
        await addDoc(collection(db, "library_id_reissue"), data);

        generatePDF(data);

        showToast("Application submitted successfully. PDF downloaded.", "success");

        form.reset();
        fileName.textContent = "No file chosen";
        previewImage.style.display = "none";
        placeholder.style.display = "flex";

      } catch (err) {
        console.error(err);
        ashowToast("Submission failed. Please try again.", "error");
      }
    };

    reader.readAsDataURL(file);
  });
});



function generatePDF(data) {
  const { jsPDF } = window.jspdf;
  const doc = new jsPDF("p", "mm", "a4");

  const pageW = doc.internal.pageSize.getWidth();
  const pageH = doc.internal.pageSize.getHeight();
  const margin = 18;
  const contentW = pageW - margin * 2;

  /* ================= LOAD LOGO ================= */

  const logoImg = new Image();
  logoImg.src = "assets/NITT_logo.png";

  logoImg.onload = () => {
    // Logo
    const logoW = 22;
    const logoH = 22;
    const logoX = margin;
    const logoY = 12;
    doc.addImage(logoImg, "PNG", logoX, logoY, logoW, logoH);

    /* ================= HEADER TEXT ================= */

    doc.setFont("helvetica", "bold");
    doc.setFontSize(16);
    doc.text(
      "NATIONAL INSTITUTE OF TECHNOLOGY",
      pageW / 2 + 5,
      22,
      { align: "center" }
    );

    doc.setFont("helvetica", "normal");
    doc.setFontSize(12);
    doc.text("TIRUCHIRAPPALLI", pageW / 2 + 5, 28, { align: "center" });

    doc.setFontSize(9);
    doc.text(
      "(INational Highway 67, Tiruchirappalli - 620015, Tamil Nadu,)",
      pageW / 2 + 5,
      33,
      { align: "center" }
    );

    doc.setLineWidth(0.5);
    doc.line(margin, 37, pageW - margin, 37);

    drawBody();
  };

  /* ================= BODY ================= */

  function drawBody() {
    // Title
    doc.setFont("helvetica", "bold");
    doc.setFontSize(13);
    doc.text(
      "Institute ID Card Re-issue Application",
      pageW / 2,
      48,
      { align: "center" }
    );

    let xLeft = margin;
    let y = 60;
    const lineGap = 8;

    doc.setFont("helvetica", "normal");
    doc.setFontSize(11);

    function printField(label, value) {
      doc.setFont("helvetica", "bold");
      doc.text(label + ":", xLeft, y);
      const lw = doc.getTextWidth(label + ":");
      doc.setFont("helvetica", "normal");
      doc.text(String(value || ""), xLeft + lw + 3, y);
      y += lineGap;
    }

    printField("Name", data.name);
    printField("Roll No", data.rollNo);
    printField("Programme", data.programme);
    printField("Branch", data.branch);
    printField("Batch", data.batch);
    printField("DOB", data.dob);
    printField("Blood Group", data.bloodGroup);
    printField("Email", data.email);
    printField("Phone", data.phone);
    printField("Parent Mobile", data.parentMobile);

    // Address
    doc.setFont("helvetica", "bold");
    doc.text("Address:", xLeft, y);
    const addrX = xLeft + doc.getTextWidth("Address:") + 3;
    doc.setFont("helvetica", "normal");

    const addressText = `${data.address1 || ""}${data.address2 ? ", " + data.address2 : ""}, ${data.district || ""}, ${data.state || ""} - ${data.pinCode || ""}`;
    const splitAddr = doc.splitTextToSize(addressText, contentW - 80);
    doc.text(splitAddr, addrX, y);
    y += splitAddr.length * lineGap;

    /* ================= PHOTO ================= */

    const photoBoxW = 55;
    const photoBoxH = 70;
    const photoX = pageW - margin - photoBoxW;
    const photoY = 55;

    doc.setDrawColor(150);
    doc.setLineWidth(0.6);
    doc.rect(photoX, photoY, photoBoxW, photoBoxH);

    if (data.photoBase64) {
      const img = new Image();
      img.onload = () => {
        const iw = img.width;
        const ih = img.height;

        let w = photoBoxW;
        let h = (ih / iw) * w;

        if (h > photoBoxH) {
          h = photoBoxH;
          w = (iw / ih) * h;
        }

        const px = photoX + (photoBoxW - w) / 2;
        const py = photoY + (photoBoxH - h) / 2;

        doc.addImage(img, "JPEG", px, py, w, h, undefined, "FAST");

        finalizePDF();
      };
      img.src = data.photoBase64;
    } else {
      doc.text("Photo", photoX + photoBoxW / 2, photoY + photoBoxH / 2, {
        align: "center",
        baseline: "middle"
      });
      finalizePDF();
    }
  }

  /* ================= FOOTER ================= */

  function finalizePDF() {
    const sigY = pageH - 40;

    doc.setDrawColor(0);
    doc.setLineWidth(0.4);

    doc.line(margin + 10, sigY, margin + 60, sigY);
    doc.line(pageW - margin - 60, sigY, pageW - margin - 10, sigY);

    doc.setFont("helvetica", "normal");
    doc.setFontSize(10);
    doc.text("Student Signature", margin + 10, sigY + 6);
    doc.text("Library Authority", pageW - margin - 60, sigY + 6);

    doc.save(`Library_ID_Reissue_${data.rollNo || "application"}.pdf`);
  }
}


