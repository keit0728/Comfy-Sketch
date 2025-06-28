"use client";
import dynamic from "next/dynamic";

const View = dynamic(() => import("./view"), { ssr: false });
export default View;
