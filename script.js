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


// pdf generation
function generatePDF(data) {
  const { jsPDF } = window.jspdf;
  const doc = new jsPDF('p', 'mm', 'a4');

  const pageW = doc.internal.pageSize.getWidth();
  const pageH = doc.internal.pageSize.getHeight();
  const margin = 18;
  const contentW = pageW - margin * 2;

  // Header / letterhead
  doc.setFontSize(16);
  doc.setFont("helvetica", "bold");
  doc.text("NATIONAL INSTITUTE OF TECHNOLOGY", pageW / 2, 22, { align: "center" });
  doc.setFontSize(12);
  doc.setFont("helvetica", "normal");
  doc.text("TIRUCHIRAPPALLI", pageW / 2, 28, { align: "center" });
  doc.setFontSize(9);
  doc.text("(Institute of National Importance, Ministry of Education)", pageW / 2, 33, { align: "center" });
  doc.setLineWidth(0.5);
  doc.line(margin, 37, pageW - margin, 37);

  // Title
  doc.setFontSize(13);
  doc.setFont("helvetica", "bold");
  doc.text("Library ID Card Re-issue Application", pageW / 2, 48, { align: "center" });

  // Prepare left column start
  let xLeft = margin;
  let y = 60;
  const lineGap = 8;

  doc.setFont("helvetica", "normal");
  doc.setFontSize(11);

  // Helper to print label + value with bold label
  function printField(label, value) {
    doc.setFont("helvetica", "bold");
    doc.text(label + ": ", xLeft, y);
    const labelWidth = doc.getTextWidth(label + ": ");
    doc.setFont("helvetica", "normal");
    doc.text(String(value), xLeft + labelWidth + 2, y);
    y += lineGap;
  }

  printField("Name", data.name || "");
  printField("Roll No", data.rollNo || "");
  printField("Programme", data.programme || "");
  printField("Branch", data.branch || "");
  printField("Batch", data.batch || "");
  printField("DOB", data.dob || "");
  printField("Blood Group", data.bloodGroup || "");
  printField("Email", data.email || "");
  printField("Phone", data.phone || "");
  printField("Parent Mobile", data.parentMobile || "");

  
  doc.setFont("helvetica", "bold");
  doc.text("Address: ", xLeft, y);
  const addrX = xLeft + doc.getTextWidth("Address: ") + 2;
  doc.setFont("helvetica", "normal");
  const addressText = `${data.address1 || ""}${data.address2 ? ", " + data.address2 : ""}, ${data.district || ""}, ${data.state || ""} - ${data.pinCode || ""}`;
  const splitAddr = doc.splitTextToSize(addressText, contentW - 80); 
  doc.text(splitAddr, addrX, y);
  y += splitAddr.length * lineGap;

 
  const sigY = pageH - 40;

  const photoMaxW = 55; // mm
  const photoMaxH = 70; // mm
  const photoX = pageW - margin - photoMaxW;
  const photoY = 55;

 
  if (data.photoBase64) {
    const img = new Image();
    img.onload = function () {
      // compute scaled size
      const iw = img.width;
      const ih = img.height;
      let w = photoMaxW;
      let h = (ih / iw) * w;
      if (h > photoMaxH) {
        h = photoMaxH;
        w = (iw / ih) * h;
      }
      
      const offsetX = photoX + (photoMaxW - w) / 2;
      doc.addImage(img, "JPEG", offsetX, photoY, w, h, undefined, "FAST");
     
      doc.setDrawColor(150);
      doc.setLineWidth(0.6);
      doc.rect(photoX, photoY, photoMaxW, photoMaxH, "S");

    
      if (data.sealBase64) {
        const sealW = 40;
        const sealX = pageW - margin - photoMaxW - 10 - sealW;
        const sealY = photoY + 10;
        const sealImg = new Image();
        sealImg.onload = () => {
          doc.addImage(sealImg, "PNG", sealX, sealY, sealW, sealW);
          doc.save(`Library_ID_Reissue_${data.rollNo || "application"}.pdf`);
        };
        sealImg.src = data.sealBase64;
      } else {
       
        doc.save(`Library_ID_Reissue_${data.rollNo || "application"}.pdf`);
      }
    };
    img.src = data.photoBase64;
  } else {
    // no photo: still add placeholder and save
    doc.setDrawColor(200);
    doc.rect(photoX, photoY, photoMaxW, photoMaxH, "S");
    doc.text("Photo", photoX + photoMaxW / 2, photoY + photoMaxH / 2, { align: "center", baseline: "middle" });
    doc.save(`Library_ID_Reissue_${data.rollNo || "application"}.pdf`);
  }

  // Draw signature lines (these will be on the saved PDF already)
  doc.setFontSize(10);
  doc.setDrawColor(0);
  doc.setLineWidth(0.4);
  doc.line(margin + 10, sigY, margin + 60, sigY); 
  doc.line(pageW - margin - 60, sigY, pageW - margin - 10, sigY); 
  doc.setFont("helvetica", "normal");
  doc.text("Student Signature", margin + 10, sigY + 6);
  doc.text("Library Authority", pageW - margin - 60, sigY + 6);
}

