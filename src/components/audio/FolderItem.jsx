import { FolderOpen, Folder } from "lucide-react";
import { getStorageUrl, ASSET_PATHS } from "@/config/assets";

export default function FolderItem({ folderName, isOpen, onClick }) {
    return (
        <div
            className="group relative aspect-square border border-black bg-white flex flex-col justify-between p-2 transition-all duration-200 ease-in-out hover:bg-gray-100 hover:shadow-lg cursor-pointer"
            onClick={onClick}
        >
            {/* Red "HOT" Sticker */}
            <div className="absolute -top-5 -right-6 z-30">
                <div className="relative">
                    <img
                        src={getStorageUrl(ASSET_PATHS.stickerHot)}
                        alt="Hot"
                        className="w-14 h-14 transform rotate-12"
                    />
                    <div className="absolute inset-0 flex items-center justify-center transform rotate-12">
                        <span className="font-heavy text-xs text-white">
                            HOT
                        </span>
                    </div>
                </div>
            </div>

            {/* Top Section: Folder Name */}
            <div className="text-left z-10 relative">
                <p className="font-heavy text-xs tracking-tight leading-tight">
                    {folderName.toLowerCase()}
                </p>
            </div>

            {/* Center Section: Folder Icon */}
            <div className="absolute inset-0 flex items-center justify-center z-20">
                {isOpen ? (
                    <FolderOpen
                        className="w-9 h-9 text-gray-800"
                        strokeWidth={1.5}
                    />
                ) : (
                    <Folder
                        className="w-9 h-9 text-gray-800"
                        strokeWidth={1.5}
                    />
                )}
            </div>

            {/* Bottom Section: Year Range */}
            <div className="flex items-end justify-start z-30 relative">
                <div className="font-mono text-xs text-gray-700">
                    <span>1950-1970&apos;s</span>
                </div>
            </div>
        </div>
    );
}
