import React from "react";

const permissionFields = [
    "createUser",
    "readUser",
    "updateUser",
    "deleteUser",
    "createBook",
    "readBook",
    "updateBook",
    "deleteBook",
];

function PermissionForm({ user, setUser }) {
    const handlePermissionChange = (e) => {
        const { name, checked } = e.target;
        setUser((prev) => ({ ...prev, [name]: checked }));
    };

    return (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {permissionFields.map((field) => (
                <label key={field} className="flex items-center gap-2">
                    <input
                        type="checkbox"
                        name={field}
                        checked={user[field] || false}
                        onChange={handlePermissionChange}
                        className="h-4 w-4"
                    />
                    <span className="capitalize">{field.replace(/([A-Z])/g, " $1")}</span>
                </label>
            ))}
            <p onClick={()=> console.log("User Permision",user)}>Submit</p>
        </div>
    );
}

export default PermissionForm;
