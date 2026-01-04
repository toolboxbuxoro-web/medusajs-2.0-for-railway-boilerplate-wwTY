export interface HomeBanner {
  id: string;
  image: string;
  action: string;
  title: {
    ru: string;
    uz: string;
  };
}

export type HomeSection = 
  | {
      id: string;
      type: 'banner_slider';
      data: HomeBanner[];
    }
  | {
      id: string;
      type: 'category_chips';
      data_source: string;
    }
  | {
      id: string;
      type: 'product_rail';
      collection_id: string;
      title: {
        ru: string;
        uz: string;
      };
      handle?: string;
    };

export interface HomeFeedRes {
  sections: HomeSection[];
}
