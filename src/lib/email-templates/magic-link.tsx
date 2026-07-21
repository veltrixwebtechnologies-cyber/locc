import * as React from "react";

import { Body, Container, Head, Heading, Html, Preview, Text } from "@react-email/components";

interface MagicLinkEmailProps {
  siteName: string;
  token: string;
}

export const MagicLinkEmail = ({ siteName, token }: MagicLinkEmailProps) => (
  <Html lang="en" dir="ltr">
    <Head />
    <Preview>
      Your {siteName} verification code is {token}
    </Preview>
    <Body style={main}>
      <Container style={container}>
        <Heading style={h1}>Your verification code</Heading>
        <Text style={text}>
          Use the 6-digit code below to sign in to {siteName}. This code will expire shortly.
        </Text>
        <Text style={codeStyle}>{token}</Text>
        <Text style={footer}>
          If you didn't request this code, you can safely ignore this email.
        </Text>
      </Container>
    </Body>
  </Html>
);

export default MagicLinkEmail;

const main = { backgroundColor: "#ffffff", fontFamily: "Arial, sans-serif" };
const container = { padding: "24px 28px", maxWidth: "480px" };
const h1 = {
  fontSize: "22px",
  fontWeight: "bold" as const,
  color: "#1E2A2F",
  margin: "0 0 16px",
};
const text = {
  fontSize: "14px",
  color: "#55575d",
  lineHeight: "1.5",
  margin: "0 0 20px",
};
const codeStyle = {
  fontFamily: "Courier, monospace",
  fontSize: "32px",
  fontWeight: "bold" as const,
  color: "#2A6F77",
  letterSpacing: "8px",
  margin: "0 0 24px",
  padding: "16px",
  backgroundColor: "#F2E8D5",
  borderRadius: "8px",
  textAlign: "center" as const,
};
const footer = { fontSize: "12px", color: "#999999", margin: "30px 0 0" };
