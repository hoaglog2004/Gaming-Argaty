import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from "react";
import { useAuth } from "./AuthContext";
import { wishlistApi } from "../services/apiServices";

const WishlistContext = createContext(null);

const normalizeIds = (payload) => {
  if (!Array.isArray(payload)) return [];
  return payload.map((id) => Number(id)).filter((id) => Number.isFinite(id));
};

const normalizeWishlistItems = (payload) => {
  if (Array.isArray(payload)) return payload;
  if (Array.isArray(payload?.content)) return payload.content;
  if (Array.isArray(payload?.items)) return payload.items;
  return [];
};

// eslint-disable-next-line react-refresh/only-export-components
export const useWishlist = () => useContext(WishlistContext);

export const WishlistProvider = ({ children }) => {
  const { isAuthenticated, loading: authLoading } = useAuth();
  const [wishlistIds, setWishlistIds] = useState([]);
  const [loading, setLoading] = useState(false);

  const refreshWishlistIds = useCallback(async () => {
    if (!isAuthenticated) {
      setWishlistIds([]);
      return [];
    }

    setLoading(true);
    try {
      const data = await wishlistApi.ids();
      const ids = normalizeIds(data);
      setWishlistIds(ids);
      return ids;
    } catch {
      setWishlistIds([]);
      return [];
    } finally {
      setLoading(false);
    }
  }, [isAuthenticated]);

  useEffect(() => {
    if (authLoading) return;
    refreshWishlistIds();
  }, [authLoading, refreshWishlistIds]);

  const toggleWishlist = useCallback(
    async (productId) => {
      const id = Number(productId);
      if (!Number.isFinite(id)) {
        throw new Error("INVALID_PRODUCT_ID");
      }
      if (!isAuthenticated) {
        throw new Error("AUTH_REQUIRED");
      }

      const wasWishlisted = wishlistIds.includes(id);
      setWishlistIds((prev) =>
        wasWishlisted ? prev.filter((x) => x !== id) : [...prev, id],
      );

      try {
        await wishlistApi.toggle(id);
        return !wasWishlisted;
      } catch (error) {
        setWishlistIds((prev) =>
          wasWishlisted
            ? [...new Set([...prev, id])]
            : prev.filter((x) => x !== id),
        );
        throw error;
      }
    },
    [isAuthenticated, wishlistIds],
  );

  const removeFromWishlist = useCallback(
    async (productId) => {
      const id = Number(productId);
      if (!Number.isFinite(id)) {
        throw new Error("INVALID_PRODUCT_ID");
      }
      if (!isAuthenticated) {
        throw new Error("AUTH_REQUIRED");
      }

      await wishlistApi.remove(id);
      setWishlistIds((prev) => prev.filter((x) => x !== id));
    },
    [isAuthenticated],
  );

  const listWishlist = useCallback(async () => {
    if (!isAuthenticated) return [];
    const data = await wishlistApi.list();
    return normalizeWishlistItems(data);
  }, [isAuthenticated]);

  const value = useMemo(
    () => ({
      wishlistIds,
      wishlistCount: wishlistIds.length,
      loading,
      refreshWishlistIds,
      toggleWishlist,
      removeFromWishlist,
      listWishlist,
      isWishlisted: (productId) => wishlistIds.includes(Number(productId)),
    }),
    [
      wishlistIds,
      loading,
      refreshWishlistIds,
      toggleWishlist,
      removeFromWishlist,
      listWishlist,
    ],
  );

  return (
    <WishlistContext.Provider value={value}>
      {children}
    </WishlistContext.Provider>
  );
};
