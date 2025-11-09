import React, { useEffect, useState, useRef } from "react";
import "./User.css";
import axios from "axios";
import { Link } from "react-router-dom";
import toast from "react-hot-toast";
import "bootstrap/dist/css/bootstrap.min.css";
import "bootstrap/dist/js/bootstrap.bundle.min.js";

import $ from "jquery";
import "datatables.net-bs5";
import "datatables.net-bs5/css/dataTables.bootstrap5.min.css";

const User = () => {
  const [users, setUsers] = useState([]);
  const [errorMsg, setErrorMsg] = useState("");
  const [loading, setLoading] = useState(true);
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

  // 🔹 Ouvrir le modal d'ajout
  const openModal = (e) => {
    e.preventDefault();
    const modal = new window.bootstrap.Modal(modalRef.current);
    modal.show();
  };

  // 🔹 Supprimer un utilisateur
  const deleteUser = async (userId) => {
    try {
      const response = await axios.delete(
        `http://localhost:3001/delete/user/${userId}`
      );
      setUsers((prev) => prev.filter((user) => user._id !== userId));
      toast.success(response.data.message, { position: "top-center" });
    } catch (error) {
      console.error(error);
      toast.error("Erreur lors de la suppression.");
    }
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
    try {
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
      setFormData({ name: "", address: "", email: "", phone: "", photo: null });

      const modal = window.bootstrap.Modal.getInstance(modalRef.current);
      modal.hide();
    } catch (error) {
      console.error("Erreur d'ajout :", error);
      toast.error("Échec de l’ajout de l’utilisateur.");
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

  try {
    const formDataToSend = new FormData();
    formDataToSend.append("name", selectedUser.name);
    formDataToSend.append("email", selectedUser.email);
    formDataToSend.append("address", selectedUser.address);
    formDataToSend.append("phone", selectedUser.phone);

    if (selectedUser.photo instanceof File) {
      formDataToSend.append("photo", selectedUser.photo);
    }

    // ✅ Récupérer la réponse du serveur
    const { data } = await axios.put(
      `http://localhost:3001/user/${selectedUser._id}`,
      formDataToSend,
      { headers: { "Content-Type": "multipart/form-data" } }
    );

    toast.success("Utilisateur mis à jour avec succès !");

    // ✅ Utiliser les données retournées du serveur (data.user)
    setUsers((prev) =>
      prev.map((u) => (u._id === selectedUser._id ? data.user : u))
    );

    // ✅ Mettre à jour selectedUser pour qu'il pointe sur la nouvelle photo
    setSelectedUser(data.user);
    setPreviewEditPhoto(
      data.user.photo ? `http://localhost:3001/uploads/${data.user.photo}` : null
    );

    const modal = window.bootstrap.Modal.getInstance(
      document.getElementById("editModal")
    );
    modal.hide();
  } catch (error) {
    console.error("Erreur de mise à jour :", error);
    toast.error("Échec de la mise à jour de l’utilisateur.");
  }
};


  return (
    <div className="userTable container py-4">
      <div className="d-flex justify-content-between align-items-center mb-4">
        <h3 className="fw-bold text-primary">Gestion des Invités</h3>

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
                    className="btn btn-info"
                    onClick={() => openEditModal(user)}
                  >
                    <i className="fa-solid fa-pen-to-square"></i>
                  </button>
                  <button
                    onClick={() => deleteUser(user._id)}
                    type="button"
                    className="btn btn-danger"
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
                  <button type="submit" className="btn btn-danger">
                    Ajouter Invité
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
                    <button type="submit" className="btn btn-primary">
                      Enregistrer les modifications
                    </button>
                  </div>
                </form>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default User;
