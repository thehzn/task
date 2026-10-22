const getCookieOpts = () => {
  const isProd = process.env.NODE_ENV === "production";
  return {
    httpOnly: true,
    secure: isProd,
    sameSite: isProd ? "none" : "lax",
    maxAge: 7 * 24 * 60 * 60 * 1000,
  };
};

const getClearCookieOpts = () => {
  const { maxAge, ...rest } = getCookieOpts();
  return rest;
};

module.exports = { getCookieOpts, getClearCookieOpts };
