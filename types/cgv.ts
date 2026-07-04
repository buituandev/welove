export interface CgvMovieResponse {
    data: CgvMovie[];
}

export interface CgvMovie {
    id:            string;
    sku:           string;
    category_id:   number;
    category:      Category | string;
    name:          string;
    thumbnail:     string;
    movie_trailer: null | string;
    movie_event:   string;
    rating_code:   RatingCode | string;
    rating_icon:   string;
    codes:         Codes | string;
    is_booking:    boolean;
    is_sneakshow:  boolean;
    is_new:        boolean;
    position:      number;
    movie_endtime: number;
    release_date:  string | null;
    is_gerp:       boolean;
    showing_date:  string;
    updated_at:    string;
    movie_genre:   string;
}

export enum Category {
    ComingSoon = "Phim Sắp Chiếu",
    NowShowing = "Phim Đang Chiếu",
}

export enum Codes {
    Imax = "IMAX",
    The2D = "2D",
    The4DXIMAXScreenXULTRA4DX = "4DX,IMAX,ScreenX,ULTRA4DX",
    The4DXScreenXStariumULTRA4DX = "4DX,ScreenX,Starium,ULTRA4DX",
    The4Dx = "4DX",
}

export enum RatingCode {
    K = "K",
    No = "No",
    P = "p",
    T13 = "T13",
    T16 = "T16",
    T18 = "T18",
}
