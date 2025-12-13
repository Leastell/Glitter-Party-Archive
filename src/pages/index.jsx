import Layout from "./Layout.jsx";

import Library from "./Library";

import Upload from "./Upload";

import Home from "./Home";

import ThemeSettings from "./ThemeSettings";

import Video from "./Video";

import Subscribe from "./Subscribe";

import SubscriptionSuccess from "./SubscriptionSuccess";

import SubscriptionCancelled from "./SubscriptionCancelled";

import ManageSubscription from "./ManageSubscription";

import Feed from "./Feed";

import {
    BrowserRouter as Router,
    Route,
    Routes,
    useLocation,
} from "react-router-dom";

const PAGES = {
    Library: Library,

    Upload: Upload,

    Home: Home,

    ThemeSettings: ThemeSettings,

    Video: Video,

    Subscribe: Subscribe,

    SubscriptionSuccess: SubscriptionSuccess,

    SubscriptionCancelled: SubscriptionCancelled,

    ManageSubscription: ManageSubscription,

    Feed: Feed,
};

function _getCurrentPage(url) {
    if (url.endsWith("/")) {
        url = url.slice(0, -1);
    }
    let urlLastPart = url.split("/").pop();
    if (urlLastPart.includes("?")) {
        urlLastPart = urlLastPart.split("?")[0];
    }

    const pageName = Object.keys(PAGES).find(
        (page) => page.toLowerCase() === urlLastPart.toLowerCase()
    );
    return pageName || Object.keys(PAGES)[0];
}

// Create a wrapper component that uses useLocation inside the Router context
function PagesContent() {
    const location = useLocation();
    const currentPage = _getCurrentPage(location.pathname);

    return (
        <Layout currentPageName={currentPage}>
            <Routes>
                <Route path="/" element={<Library />} />

                <Route path="/Library" element={<Library />} />

                <Route path="/Upload" element={<Upload />} />

                <Route path="/Home" element={<Home />} />

                <Route path="/ThemeSettings" element={<ThemeSettings />} />

                <Route path="/Video" element={<Video />} />

                <Route path="/Subscribe" element={<Subscribe />} />

                <Route
                    path="/SubscriptionSuccess"
                    element={<SubscriptionSuccess />}
                />

                <Route
                    path="/SubscriptionCancelled"
                    element={<SubscriptionCancelled />}
                />

                <Route
                    path="/ManageSubscription"
                    element={<ManageSubscription />}
                />

                <Route path="/Feed" element={<Feed />} />
            </Routes>
        </Layout>
    );
}

export default function Pages() {
    return (
        <Router>
            <PagesContent />
        </Router>
    );
}
