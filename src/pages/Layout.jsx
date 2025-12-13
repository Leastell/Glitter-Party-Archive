import React from "react";
import { Link, useLocation } from "react-router-dom";
import { createPageUrl } from "@/utils";
import { useAuth } from "@/context/AuthProvider";
import {
    Music,
    Camera,
    MessageSquare,
    User as UserIcon,
    Settings,
    LogOut,
    ChevronDown,
    Sparkles,
} from "lucide-react";
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuLabel,
    DropdownMenuSeparator,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

export default function Layout({ children, currentPageName }) {
    const { user, signOut } = useAuth();

    const isHomePage = currentPageName === "Home";

    const handleLogout = async () => {
        try {
            await signOut();
            window.location.href = createPageUrl("Home");
        } catch (error) {
            console.error("Logout failed:", error);
        }
    };

    const getSubscriptionStatusLabel = (status) => {
        if (status === "subscriber") return "★ subscriber";
        if (status === "free") return "free tier";
        return "unauthenticated";
    };

    // Generate dynamic font CSS using hardcoded global settings
    const generateFontCSS = () => {
        // Hardcoded global font settings to ensure they apply to all users
        const globalFontSettings = {
            custom_font_url:
                "https://base44.app/api/apps/68d594da8620fa76c929e50b/files/public/68d594da8620fa76c929e50b/bc974a0af_Akzidenz-grotesk-black.ttf",
            custom_font_name: "Akzidenz grotesk black",
            font_family: "custom",
        };

        let fontCSS = `
      @import url('https://fonts.googleapis.com/css2?family=Work+Sans:wght@400;500;700;900&display=swap');
      
      @keyframes wiggle {
        0%, 100% { transform: rotate(-8deg); }
        50% { transform: rotate(8deg); }
      }
    `;

        // Define the custom font face
        const fontName = globalFontSettings.custom_font_name;
        const fontUrl = globalFontSettings.custom_font_url;
        let fontFormat = "truetype"; // Default to truetype for the .ttf file

        fontCSS += `
      @font-face {
        font-family: '${fontName}';
        src: url('${fontUrl}') format('${fontFormat}');
        font-weight: normal;
        font-style: normal;
        font-display: swap;
      }
    `;

        // Apply the custom font as the active font for everyone
        const activeFontFamily = `'${fontName}', 'Helvetica Neue', 'Arial', sans-serif`;

        fontCSS += `
      * {
        font-family: ${activeFontFamily};
      }
      
      .font-heavy {
        font-family: ${activeFontFamily};
        font-weight: 900;
        letter-spacing: -0.02em;
      }
      
      .font-mono {
        font-family: ${activeFontFamily};
        font-weight: 500;
        letter-spacing: 0.05em;
      }

      .header-link {
        font-family: ${activeFontFamily};
        font-weight: 500;
        letter-spacing: 0.1em;
      }
      .header-link-active {
        color: #000000;
        text-decoration: underline;
      }
      
      body, html {
        font-family: ${activeFontFamily};
      }
    `;

        return fontCSS;
    };

    return (
        <div className="bg-[#fffefa] text-black font-sans min-h-screen flex flex-col">
            <style>{generateFontCSS()}</style>

            {!isHomePage && (
                <>
                    {/* Header */}
                    <header className="bg-[#fffefa] p-3 md:p-5 md:px-7 sticky top-0 z-10 border-b border-black">
                        <div className="max-w-7xl mx-auto flex items-center justify-between h-full">
                            <Link
                                to={createPageUrl("Home")}
                                className="group flex items-center gap-2"
                            >
                                <h1 className="text-xl md:text-3xl font-heavy tracking-tight group-hover:text-gray-600 transition-colors">
                                    archive
                                </h1>
                            </Link>

                            {/* Centered Main Navigation Icons */}
                            <div className="absolute left-1/2 transform -translate-x-1/2 flex items-center h-full">
                                <Link
                                    to={createPageUrl("Library")}
                                    title="Breaks"
                                    className="group px-3 md:px-7 h-full flex items-center opacity-100"
                                >
                                    <img
                                        src="https://qtrypzzcjebvfcihiynt.supabase.co/storage/v1/object/public/base44-prod/public/68d594da8620fa76c929e50b/f7d5bc5c4_NewProject27.png"
                                        alt="Music"
                                        className="h-12 md:h-full w-auto object-contain py-1 md:py-2 group-hover:[animation:wiggle_0.2s_ease-in-out]"
                                        style={{ filter: "saturate(1.4)" }}
                                    />
                                </Link>
                                <Link
                                    to={createPageUrl("Feed")}
                                    title="Community"
                                    className="group px-3 md:px-7 h-full flex items-center opacity-100"
                                >
                                    <img
                                        src="https://qtrypzzcjebvfcihiynt.supabase.co/storage/v1/object/public/base44-prod/public/68d594da8620fa76c929e50b/816dcc1b3_NewProject12.png"
                                        alt="Community"
                                        className="h-12 md:h-full w-auto object-contain py-1 md:py-2 group-hover:[animation:wiggle_0.2s_ease-in-out]"
                                        style={{ filter: "saturate(1.4)" }}
                                    />
                                </Link>
                            </div>

                            {/* Secondary Navigation with Account Dropdown */}
                            <div className="flex items-center gap-2 md:gap-4">
                                {user?.role === "admin" && (
                                    <>
                                        <Link
                                            to={createPageUrl("Upload")}
                                            className={`header-link text-xs hidden md:block ${
                                                currentPageName === "Upload"
                                                    ? "header-link-active"
                                                    : ""
                                            }`}
                                        >
                                            [ admin upload ]
                                        </Link>
                                    </>
                                )}

                                {/* User Account Dropdown */}
                                {user && (
                                    <DropdownMenu>
                                        <DropdownMenuTrigger className="flex items-center gap-2 hover:opacity-70 transition-opacity">
                                            <img
                                                src="https://qtrypzzcjebvfcihiynt.supabase.co/storage/v1/object/public/base44-prod/public/68d594da8620fa76c929e50b/55f80c254_NewProject30.png"
                                                alt="User"
                                                className="w-8 h-8 md:w-10 md:h-10 object-contain"
                                            />
                                            <ChevronDown className="w-3 h-3" />
                                        </DropdownMenuTrigger>
                                        <DropdownMenuContent className="w-56 bg-white border-2 border-black rounded-none">
                                            <DropdownMenuLabel className="font-heavy text-xs">
                                                {user.full_name || user.email}
                                            </DropdownMenuLabel>
                                            <DropdownMenuSeparator className="bg-black" />
                                            <DropdownMenuItem
                                                onClick={() =>
                                                    (window.location.href =
                                                        createPageUrl(
                                                            "ManageSubscription"
                                                        ))
                                                }
                                                className="font-mono text-xs cursor-pointer"
                                            >
                                                status:{" "}
                                                {getSubscriptionStatusLabel(
                                                    user.subscription_status
                                                )}
                                            </DropdownMenuItem>
                                            <DropdownMenuSeparator className="bg-black" />
                                            {user.role === "admin" && (
                                                <DropdownMenuItem
                                                    onClick={() =>
                                                        (window.location.href =
                                                            createPageUrl(
                                                                "ThemeSettings"
                                                            ))
                                                    }
                                                    className="font-mono text-xs cursor-pointer"
                                                >
                                                    <Settings className="w-4 h-4 mr-2" />
                                                    theme settings
                                                </DropdownMenuItem>
                                            )}
                                            {user.subscription_status ===
                                                "free" && (
                                                <DropdownMenuItem
                                                    onClick={() =>
                                                        (window.location.href =
                                                            createPageUrl(
                                                                "Subscribe"
                                                            ))
                                                    }
                                                    className="font-mono text-xs cursor-pointer"
                                                >
                                                    <Sparkles className="w-4 h-4 mr-2" />
                                                    upgrade account
                                                </DropdownMenuItem>
                                            )}
                                            <DropdownMenuItem
                                                onClick={handleLogout}
                                                className="font-mono text-xs cursor-pointer text-red-600"
                                            >
                                                <LogOut className="w-4 h-4 mr-2" />
                                                log out
                                            </DropdownMenuItem>
                                        </DropdownMenuContent>
                                    </DropdownMenu>
                                )}
                            </div>
                        </div>
                    </header>
                </>
            )}

            {/* Main Content */}
            <main className={`${isHomePage ? "" : "p-4 md:p-6"} flex-grow`}>
                {children}
            </main>

            {!isHomePage && (
                /* Footer */
                <footer className="bg-[#fffefa] text-center mt-64 p-6 border-t border-black">
                    <p className="font-mono text-xs text-black flex items-center justify-center gap-2">
                        <span>★</span>
                        (c) 2024 glitter party archive. all rights reserved.
                        <span>★</span>
                    </p>
                </footer>
            )}
        </div>
    );
}
