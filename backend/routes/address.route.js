router.use(authMiddleware);

router.route("/").get(authorize("admin"), getAddresses).post(createAddress);
router.get("/user/:id", selfOrAdmin("id"), getAddressByUserId);

router.route("/:id")
    .get(getAddressById)
    .patch(updateAddress)
    .delete(deleteAddress);

    export default router;