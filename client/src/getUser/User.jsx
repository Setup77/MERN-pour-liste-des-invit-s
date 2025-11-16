import React, { useEffect, useState, useRef } from "react";
import "./User.css";
import axios from "axios";
import { Link } from "react-router-dom";
import toast from "react-hot-toast";
import "bootstrap/dist/css/bootstrap.min.css";
import "bootstrap/dist/js/bootstrap.bundle.min.js";

import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";
import html2canvas from "html2canvas";


import $ from "jquery";
import "datatables.net-bs5";
import "datatables.net-bs5/css/dataTables.bootstrap5.min.css";

const User = () => {
  const [users, setUsers] = useState([]);
  const [errorMsg, setErrorMsg] = useState("");
  const [userToDelete, setUserToDelete] = useState(null);
  const [base64Photo, setBase64Photo] = useState(null);

  const [loading, setLoading] = useState(true);
  const [loadingUpdate, setLoadingUpdate] = useState(false);
  const [loadingAdd, setLoadingAdd] = useState(false);
  const [deleteLoading, setDeleteLoading] = useState(false);

  const [formData, setFormData] = useState({
    name: "",
    address: "",
    email: "",
    phone: "",
    photo: null,
  });

  const [selectedUser, setSelectedUser] = useState(null);
  const [previewEditPhoto, setPreviewEditPhoto] = useState(null);

  const modalRef = useRef(null);

  //----Fonction utilitaire pour convertir une image URL → Base64
  const toBase64 = (url) =>
    fetch(url)
      .then(res => res.blob())
      .then(
        blob =>
          new Promise((resolve) => {
            const reader = new FileReader();
            reader.onloadend = () => resolve(reader.result);
            reader.readAsDataURL(blob);
          })
      );

  //---Charger automatiquement la photo Base64 quand selectedUser change
  useEffect(() => {
    const loadPhoto = async () => {
      if (selectedUser) {
        const photoUrl = selectedUser.photo
          ? `http://localhost:3001/uploads/${selectedUser.photo}`
          : "http://localhost:3001/uploads/Default.jpg";

        const base64 = await toBase64(photoUrl);
        setBase64Photo(base64);
      }
    };

    loadPhoto();
  }, [selectedUser]);



  // 🔹 Charger les utilisateurs
  useEffect(() => {
    const fetchData = async () => {
      try {
        const response = await axios.get("http://localhost:3001/users");
        setUsers(response.data);
        setErrorMsg("");
      } catch (error) {
        if (error.response && error.response.status === 404) {
          setUsers([]);
        } else {
          console.error("Erreur de connexion :", error);
          setErrorMsg("Impossible de récupérer les utilisateurs.");
        }
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  // 🔹 Initialiser DataTables (une seule fois)
  useEffect(() => {
    const table = document.getElementById("userTable");
    if (!table || users.length === 0) return;
    if (!$.fn.dataTable.isDataTable(table)) {
      $(table).DataTable({
        paging: true,
        searching: true,
        ordering: true,
        info: true,
        language: {
          url: "/datatables/fr-FR.json",
        },
      });
    }
  }, [users.length]);


  //--- Composant PDF d'un utilisateur en carte de visite

const downloadPDF = async () => {
  const element = document.getElementById("pdfContent");

  if (!element) {
    toast.error("Erreur : contenu PDF introuvable !");
    return;
  }

  const canvas = await html2canvas(element, {
    scale: 2,
    useCORS: true,
    allowTaint: false,
    taintTest: false,
    imageTimeout: 0,
  });

  const imgData = canvas.toDataURL("image/png");
  const pdf = new jsPDF("p", "mm", "a4");

  const imgWidth = 190;
  const imgHeight = (canvas.height * imgWidth) / canvas.width;

  pdf.addImage(imgData, "PNG", 10, 10, imgWidth, imgHeight);
  pdf.save(`Fiche-${selectedUser.name.replace(/\s+/g, "_")}.pdf`);
};


  /* Générateur PDF des utilisateurs*/

  const generatePDF = () => {
    const doc = new jsPDF();

    // Titre
    doc.setFontSize(18);
    doc.text("Liste des Invités", 14, 20);

    // Construire le tableau
    const tableColumn = ["Noms", "Email", "Téléphones", "Fonctions", "Address"];
    const tableRows = [];

    users.forEach((user) => {
      tableRows.push([
        user.name,
        user.email,
        user.phone,
        user.role,
        user.address,
      ]);
    });

    // Génération du tableau PDF
    autoTable(doc, {
      startY: 30,
      head: [tableColumn],
      body: tableRows,
    });

    // Télécharger
    doc.save("liste_invites.pdf");
  };



  // 🔹 Ouvrir le modal d'ajout
  const openModal = (e) => {
    e.preventDefault();
    const modal = new window.bootstrap.Modal(modalRef.current);
    modal.show();
  };


  // 🔹 Gestion des inputs ajout
  const handleInputChange = (e) => {
    const { name, value, files } = e.target;
    if (files) {
      setFormData((prev) => ({ ...prev, [name]: files[0] }));
      getAvatar(e);
    } else {
      setFormData((prev) => ({ ...prev, [name]: value }));
    }
  };

  // 🔹 Prévisualisation photo ajout
  const getAvatar = (event) => {
    const preview = document.getElementById("previewphoto");
    const file = event.target.files[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (e) => {
        preview.innerHTML = `
          <img src="${e.target.result}" alt="Photo" 
               class="img-fluid rounded-circle shadow-sm mt-3"
               style="width:120px; height:120px; object-fit:cover;">`;
      };
      reader.readAsDataURL(file);
    } else {
      preview.innerHTML = "";
    }
  };

  // 🔹 Soumission formulaire ajout
  const handleSubmit = async (e) => {
    e.preventDefault();
    const preview = document.getElementById("previewphoto");

    try {
      setLoadingAdd(true); // ⬅️ DÉBUT DU LOADER

      const formDataToSend = new FormData();
      Object.entries(formData).forEach(([key, value]) => {
        formDataToSend.append(key, value);
      });

      const response = await axios.post(
        "http://localhost:3001/user",
        formDataToSend,
        { headers: { "Content-Type": "multipart/form-data" } }
      );

      toast.success("Invité ajouté avec succès !");
      setUsers((prev) => [...prev, response.data.user]);

      // 🔹 Reset total du formulaire
      setFormData({
        name: "",
        address: "",
        email: "",
        phone: "",
        role: "",
        photo: null
      });

      // 🔹 Reset du file input
      document.getElementById("photo").value = "";

      // 🔹 Reset preview
      preview.innerHTML = "";

      // 🔹 Fermer modal
      const modal = window.bootstrap.Modal.getInstance(modalRef.current);
      modal.hide();

    } catch (error) {
      console.error("Erreur d'ajout :", error);
      toast.error("Échec de l’ajout de l’utilisateur.");
    } finally {
      setLoadingAdd(false); // ⬅️ FIN DU LOADER
    }
  };


  // 🔹 Ouvrir le modal d'édition
  const openEditModal = (user) => {
    setSelectedUser(user);
    setPreviewEditPhoto(
      user.photo ? `http://localhost:3001/uploads/${user.photo}` : null
    );
    const modal = new window.bootstrap.Modal(
      document.getElementById("editModal")
    );
    modal.show();
  };

  // 🔹 Gestion des inputs édition
  const handleEditChange = (e) => {
    const { name, value, files } = e.target;
    if (files) {
      const file = files[0];
      setSelectedUser((prev) => ({ ...prev, photo: file }));

      const reader = new FileReader();
      reader.onload = (ev) => setPreviewEditPhoto(ev.target.result);
      reader.readAsDataURL(file);
    } else {
      setSelectedUser((prev) => ({ ...prev, [name]: value }));
    }
  };

  // 🔹 Soumission mise à jour
  const handleUpdate = async (e) => {
    e.preventDefault();

    setLoadingUpdate(true); // 👉 Activer loader

    try {
      const formDataToSend = new FormData();
      formDataToSend.append("name", selectedUser.name);
      formDataToSend.append("email", selectedUser.email);
      formDataToSend.append("address", selectedUser.address);
      formDataToSend.append("phone", selectedUser.phone);
      formDataToSend.append("role", selectedUser.role);

      if (selectedUser.photo instanceof File) {
        formDataToSend.append("photo", selectedUser.photo);
      }

      const { data } = await axios.put(
        `http://localhost:3001/user/${selectedUser._id}`,
        formDataToSend,
        { headers: { "Content-Type": "multipart/form-data" } }
      );

      toast.success("Utilisateur mis à jour avec succès !");

      setUsers((prev) =>
        prev.map((u) => (u._id === selectedUser._id ? data.user : u))
      );

      setSelectedUser(data.user);
      setPreviewEditPhoto(
        data.user.photo ? `http://localhost:3001/uploads/${data.user.photo}` : null
      );

      // 👉 Fermeture propre du modal
      const modal = window.bootstrap.Modal.getInstance(
        document.getElementById("editModal")
      );
      modal.hide();

      // 👉 Attendre que le fade-out soit terminé puis nettoyer backdrop
      setTimeout(() => {
        document.querySelectorAll(".modal-backdrop").forEach((el) => el.remove());
        document.body.classList.remove("modal-open");
        document.body.style = "";
      }, 300);

      setSelectedUser(null);
      setPreviewEditPhoto(null);


    } catch (error) {
      console.error("Erreur de mise à jour :", error);
      toast.error("Échec de la mise à jour de l’utilisateur.");
    }

    setLoadingUpdate(false); // 👉 Désactiver loader
  };


  ///---Modal qui affiche les utilisateurs

  const openViewModal = (user) => {
    setSelectedUser(user);

    const modal = new window.bootstrap.Modal(
      document.getElementById("viewModal")
    );
    modal.show();
  };

  //*** Fonction de Suppression d'utilisateur par confirmation

  const openDeleteModal = (user) => {
    setUserToDelete(user);

    const modalEl = document.getElementById("confirmDeleteModal");
    const modal = new window.bootstrap.Modal(modalEl);
    modal.show();
  };


  const closeDeleteModal = () => {
    const modalEl = document.getElementById("confirmDeleteModal");
    const modalInstance = window.bootstrap.Modal.getInstance(modalEl);

    if (modalInstance) {
      modalInstance.hide();

      modalEl.addEventListener(
        "hidden.bs.modal",
        () => {
          // Nettoyage du backdrop et du scroll
          document.body.classList.remove("modal-open");
          const backdrop = document.querySelector(".modal-backdrop");
          if (backdrop) backdrop.remove();
        },
        { once: true }
      );
    }
  };

  const confirmDeleteUser = async () => {
    try {
      setDeleteLoading(true); // ⬅️ Démarre le loader

      await axios.delete(`http://localhost:3001/delete/user/${userToDelete._id}`);

      setUsers((prev) => prev.filter((u) => u._id !== userToDelete._id));

      toast.success("Utilisateur supprimé avec succès !");
    } catch (error) {
      console.error(error);
      toast.error("Erreur lors de la suppression.");
    }

    setDeleteLoading(false); // ⬅️ Arrête le loader
    closeDeleteModal();
  };


  /* Fin de la suppression d'un utilisateur*/




  return (
    <div className="userTable container py-4">
      <div className="d-flex justify-content-between align-items-center mb-4">
        <div className="d-flex align-items-center gap-3">
          <h3 className="fw-bold text-primary m-0">Gestion des Invités</h3>

          {/* Bouton PDF */}
          <button className="btn btn-outline-danger" onClick={generatePDF}>
            <i className="fa-solid fa-file-pdf me-1"></i> Fiche PDF
          </button>
        </div>

        <Link
          to="/add"
          className="btn btn-primary"
          onClick={openModal}
          type="button"
        >
          Add User <i className="fa-solid fa-user-plus ms-1"></i>
        </Link>
      </div>

      {errorMsg && <p className="text-danger">{errorMsg}</p>}

      {loading ? (
        <div className="text-center py-5">
          <div className="spinner-border text-primary" role="status"></div>
          <p className="mt-3">Chargement des utilisateurs...</p>
        </div>
      ) : users.length === 0 ? (
        <div className="noData text-center">
          <h3>Aucun utilisateur pour le moment</h3>
          <p>S'il vous plaît, ajoutez un nouvel utilisateur</p>
        </div>
      ) : (
        <table
          id="userTable"
          className="table table-bordered align-middle table-striped"
        >
          <thead className="table-light">
            <tr>
              <th>No.</th>
              <th>Nom complet</th>
              <th>Adresse</th>
              <th>Email</th>
              <th>Téléphone</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {users.map((user, index) => (
              <tr key={user._id}>
                <td>{index + 1}</td>
                <td>{user.name}</td>
                <td>{user.address}</td>
                <td>{user.email}</td>
                <td>{user.phone || "—"}</td>
                <td className="actionButtons d-flex gap-2">

                  <button
                    type="button"
                    className="btn btn-secondary"
                    onClick={() => openViewModal(user)}
                  >
                    <i className="fa fa-eye"></i>
                  </button>

                  <button
                    type="button"
                    className="btn btn-info"
                    onClick={() => openEditModal(user)}
                  >
                    <i className="fa-solid fa-pen-to-square"></i>
                  </button>

                  <button
                    type="button"
                    className="btn btn-danger"
                    onClick={() => openDeleteModal(user)}
                  >
                    <i className="fa-solid fa-trash"></i>
                  </button>


                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )}

      {/* 🔹 Modal Ajout */}
      <div
        className="modal fade"
        id="addModal"
        tabIndex="-1"
        aria-hidden="true"
        ref={modalRef}
      >
        <div className="modal-dialog modal-dialog-centered">
          <div className="modal-content border-0 shadow">
            <div className="modal-header bg-primary text-white">
              <h5 className="modal-title fw-semibold">
                Ajouter un nouvel invité
              </h5>
              <button
                type="button"
                className="btn-close btn-close-white"
                data-bs-dismiss="modal"
                aria-label="Fermer"
              ></button>
            </div>

            <div className="modal-body px-4">
              <form onSubmit={handleSubmit} encType="multipart/form-data">
                <input
                  type="text"
                  name="name"
                  placeholder="Nom et prénom"
                  required
                  className="form-control my-3"
                  value={formData.name}
                  onChange={handleInputChange}
                />
                <input
                  type="text"
                  name="address"
                  placeholder="Adresse"
                  required
                  className="form-control my-3"
                  value={formData.address}
                  onChange={handleInputChange}
                />
                <input
                  type="email"
                  name="email"
                  placeholder="E-Mail"
                  required
                  className="form-control my-3"
                  value={formData.email}
                  onChange={handleInputChange}
                />
                <input
                  type="tel"
                  name="phone"
                  placeholder="Téléphone"
                  required
                  className="form-control my-3"
                  value={formData.phone}
                  onChange={handleInputChange}
                />
                <input
                  type="text"
                  name="role"
                  placeholder="Fonction"
                  className="form-control my-3"
                  value={formData.role}
                  onChange={handleInputChange}
                />

                <div id="previewphoto" className="text-center mb-3"></div>

                <div className="input-group mb-4">
                  <input
                    type="file"
                    className="form-control"
                    id="photo"
                    name="photo"
                    accept="image/*"
                    onChange={handleInputChange}
                  />
                  <label
                    className="input-group-text text-bg-primary"
                    htmlFor="photo"
                  >
                    <i className="fa fa-image"></i>&nbsp;&nbsp; Photo
                  </label>
                </div>

                <div className="d-grid">
                  <button type="submit" className="btn btn-danger" disabled={loadingAdd}>
                    {loadingAdd ? (
                      <span className="spinner-border spinner-border-sm"></span>
                    ) : (
                      "Ajouter Invité"
                    )}
                  </button>

                </div>
              </form>
            </div>
          </div>
        </div>
      </div>

      {/* 🔹 Modal Modification */}
      <div
        className="modal fade"
        id="editModal"
        tabIndex="-1"
        aria-hidden="true"
      >
        <div className="modal-dialog modal-dialog-centered">
          <div className="modal-content border-0 shadow">
            <div className="modal-header bg-info text-white">
              <h5 className="modal-title fw-semibold">Modifier l’utilisateur</h5>
              <button
                type="button"
                className="btn-close btn-close-white"
                data-bs-dismiss="modal"
                aria-label="Fermer"
              ></button>
            </div>

            <div className="modal-body px-4">
              {selectedUser && (
                <form onSubmit={handleUpdate} encType="multipart/form-data">
                  <input
                    type="text"
                    name="name"
                    placeholder="Nom complet"
                    className="form-control my-3"
                    value={selectedUser.name}
                    onChange={handleEditChange}
                    required
                  />
                  <input
                    type="text"
                    name="address"
                    placeholder="Adresse"
                    className="form-control my-3"
                    value={selectedUser.address}
                    onChange={handleEditChange}
                    required
                  />
                  <input
                    type="email"
                    name="email"
                    placeholder="E-mail"
                    className="form-control my-3"
                    value={selectedUser.email}
                    onChange={handleEditChange}
                    required
                  />
                  <input
                    type="tel"
                    name="phone"
                    placeholder="Téléphone"
                    className="form-control my-3"
                    value={selectedUser.phone}
                    onChange={handleEditChange}
                  />
                  <input
                    type="tel"
                    name="role"
                    placeholder="Fonction"
                    className="form-control my-3"
                    value={selectedUser.role}
                    onChange={handleEditChange}
                  />

                  {selectedUser.name && (
                    <div className="text-center mb-3">
                      <img
                        src={previewEditPhoto}
                        alt={selectedUser.name || "Profil"}
                        className="img-fluid rounded-circle shadow-sm"
                        style={{
                          width: "120px",
                          height: "120px",
                          objectFit: "cover",
                        }}
                      />
                    </div>
                  )}

                  <div className="input-group mb-4">
                    <input
                      type="file"
                      className="form-control"
                      id="editPhoto"
                      name="photo"
                      accept="image/*"
                      onChange={handleEditChange}
                    />
                    <label
                      className="input-group-text text-bg-info"
                      htmlFor="editPhoto"
                    >
                      <i className="fa fa-image"></i>&nbsp;&nbsp; Photo
                    </label>
                  </div>

                  <div className="d-grid">
                    <button type="submit" className="btn btn-primary" disabled={loadingUpdate}>
                      {loadingUpdate ? (
                        <span className="spinner-border spinner-border-sm"></span>
                      ) : (
                        "Enregistrer les modifications"
                      )}
                    </button>

                  </div>
                </form>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* 🔹 Modal Voir Utilisateur en carte de visite */}
      <div className="modal fade" id="viewModal" tabIndex="-1" aria-hidden="true">
        <div className="modal-dialog modal-dialog-centered">
          <div className="modal-content border-0 shadow">
            <div className="modal-header bg-secondary text-white">
              <h5 className="modal-title fw-semibold">Carte de visite </h5>
              <button
                type="button"
                className="btn-close btn-close-white"
                data-bs-dismiss="modal"
                aria-label="Fermer"
              ></button>
            </div>

            <div className="modal-body px-2">
              {selectedUser && (
                <div id="pdfContent" className="business-card container mt-3">

                  <div className="card shadow-lg border-3 p-1 business-card-content">

                    <div className="row g-3 align-items-center">
                      <div className="col-4 col-md-3 text-center">
                        {/* Photo */}
                        <img
                          src={base64Photo}
                          alt="profil"
                          className="img-fluid rounded-circle shadow-sm mb-3 card-photo"
                          style={{ width: "120px", height: "90px", objectFit: "cover" }}
                        />
                      </div>

                      <div className="col-8 col-md-9">
                        <h3 className="fw-bold m-2">{selectedUser.name}</h3>
                        <p className="text-muted m-2">{selectedUser.role}</p>

                        <div className="mt-2 small contact-info">
                          <p className="m-2"><i className="fa fa-phone"></i> {selectedUser.phone || "—"}</p>
                          <p className="m-2"><i className="fa fa-envelope"></i> {selectedUser.email}</p>
                          <p className="m-2"><i className="fa fa-map-marker-alt"></i> {selectedUser.address}</p>
                        </div>
                      </div>
                    </div>
                  </div>

                </div>
              )}

              <div className="d-grid mt-3">
                <button
                  type="button"
                  className="btn btn-danger"
                  onClick={downloadPDF}
                >
                  <i className="fa fa-download me-2"></i>
                  Télécharger la fiche PDF
                </button>
              </div>

            </div>
          </div>
        </div>
      </div>

      {/* 🔹 Modal de Suppression  d'un Utilisateur */}
      <div
        className="modal fade"
        id="confirmDeleteModal"
        tabIndex="-1"
        aria-labelledby="deleteModalLabel"
        aria-hidden="true"
      >
        <div className="modal-dialog modal-dialog-centered">
          <div className="modal-content">

            <div className="modal-header">
              <h5 className="modal-title text-danger" id="deleteModalLabel">
                Confirmation de suppression
              </h5>
              <button type="button" className="btn-close" data-bs-dismiss="modal"></button>
            </div>

            <div className="modal-body">
              {userToDelete ? (
                <>
                  Voulez-vous vraiment supprimer <strong>{userToDelete.name}</strong> ?
                  <br />
                  Cette action est <span className="text-danger fw-bold">irréversible</span>.
                </>
              ) : (
                "Chargement..."
              )}
            </div>

            <div className="modal-footer justify-content-center">
              <button
                className="btn btn-secondary"
                data-bs-dismiss="modal"
                disabled={deleteLoading}   // Optionnel : pour éviter double clic
              >
                Annuler
              </button>

              <button
                type="button"
                className="btn btn-danger"
                onClick={confirmDeleteUser}
                disabled={deleteLoading}
              >
                {deleteLoading ? (
                  <span className="spinner-border spinner-border-sm"></span>
                ) : (
                  "Supprimer"
                )}
              </button>

            </div>

          </div>
        </div>
      </div>



    </div>
  );
};

export default User;
