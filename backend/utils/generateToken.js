// import jwt from "jsonwebtoken";

// const generateToken = (res, userId) => {
//   const token = jwt.sign({ userId }, process.env.JWT_SECRET, {
//     expiresIn: "10m",
//   });

//   res.cookie("token", token, {
//     httpOnly: true,
//     secure: process.env.NODE_ENV !== "development",
//     sameSite: "strict",
//     maxAge: 30 * 24 * 60 * 60 * 1000,
//   });

//   return token;
// };

// export default generateToken;


import jwt from "jsonwebtoken";

const generateToken = (res, userId) => {
  // Génère un token JWT valide 24h
  const token = jwt.sign({ userId }, process.env.JWT_SECRET, {
    expiresIn: "24h", // <-- token expire après 24h
  });

  // Crée un cookie qui expire aussi après 24h
  res.cookie("token", token, {
    httpOnly: true,
    secure: process.env.NODE_ENV !== "development",
    sameSite: "strict",
    maxAge: 24 * 60 * 60 * 1000, // <-- 24 heures en millisecondes
  });

  return token;
};

export default generateToken;