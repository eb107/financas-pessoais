from rest_framework.permissions import BasePermission


class IsOwner(BasePermission):
    """Allows access only to objects owned by the requesting user.

    Works for objects with a direct `user` FK (Wallet, Category, Tag) and
    for objects that reach their owner through a `wallet` FK (Transaction).
    """

    def has_object_permission(self, request, view, obj):
        owner = getattr(obj, "user", None)
        if owner is None and hasattr(obj, "wallet"):
            owner = obj.wallet.user
        return owner == request.user
